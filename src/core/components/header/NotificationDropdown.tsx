// src/core/components/header/NotificationDropdown.tsx
// import axios, { AxiosError } from "axios";
import { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { useAppNavigate } from "@/core/router/useAppNavigate";
import { Menu } from "@headlessui/react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { useSuperApp } from "@/core/context/SuperAppContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetNotificationByIdQuery } from "@/core/store/api/notificationApi";
// import { useGetNotificationByIdQuery as UseGetNotificationByIdQuery } from "@/core/store/api/notificationApi";
// import { APP_CONFIG, POPUP_AUTO_DISMISS_MS, POPUP_GROUP_AUTO_CLOSE_MS, POPUP_TRANSITION_MS } from "@/core/utils/constants";
import { POPUP_AUTO_DISMISS_MS, POPUP_GROUP_AUTO_CLOSE_MS, POPUP_TRANSITION_MS } from "@/core/utils/constants";
import { isValidImageUrl } from "@/core/utils/resourceValidators";
import { formatLastNotification } from "@/core/utils/utils";
import type { Notification, PopupItem } from "@/core/types/notification";
// import type { Notification, NotificationEvent, PopupItem } from "@/core/types/notification";

const NotificationDropdown = () => {
  const isSuper = useSuperApp();
  const { t } = useTranslation();
  // const navigate = useNavigate();
  const navigate = useAppNavigate("cms");

  // Use main WebSocket context instead of creating own socket
  const { connectionState, isConnected, onMessage, websocket } = useWebSocket();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeAllTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const hasInitialized = useRef(false);
  const itemTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const textRefs = useRef<{ [key: string]: HTMLParagraphElement | null }>({});
  const visibleIdsRef = useRef<Set<string>>(new Set());
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("All Types");
  const [isOpen, setIsOpen] = useState(false);
  const [isOverflow, setIsOverflow] = useState<{ [key: string]: boolean }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [notifying, setNotifying] = useState(false);
  const [popupQueue, setPopupQueue] = useState<PopupItem[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [unread, setUnread] = useState(0);

  // ===================================================================
  // Token
  // ===================================================================
  const getAuthToken = () => {
    const token = localStorage.getItem("access_token");
    return token;
  };

  // ===================================================================
  // Get profile
  // ===================================================================
  const getProfile = () => {
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        return JSON.parse(profile);
      }
      catch {
        return null;
      }
    }
    return null;
  };

  // ===================================================================
  // Preferences
  // ===================================================================
  const getPreferences = () => {
    const defaultPreferences = {
      autoDelete: false,
      autoDeleteDays: 7,
      hideRead: false,
      popupEnabled: true,
      pushEnabled: true,
      soundEnabled: true,
      sound: "default",
    };
    const saved = localStorage.getItem("notification_preferences");
    if (saved) {
      try {
        return { ...defaultPreferences, ...JSON.parse(saved) };
      }
      catch (err) {
        console.error("Failed to parse notification preferences:", err);
      }
    }
    return defaultPreferences;
  };

  const closeAllPopups = () => {
    popupQueue.forEach(i => {
      visibleIdsRef.current.delete(i.id);
      if (itemTimersRef.current[i.id]) {
        clearTimeout(itemTimersRef.current[i.id]);
        delete itemTimersRef.current[i.id];
      }
    });
    setPopupQueue(q => [...q]);
    clearGroupCloseTimer();
    setTimeout(() => setPopupQueue([]), POPUP_TRANSITION_MS);
  };

  const clearGroupCloseTimer = () => {
    if (closeAllTimerRef.current) {
      clearTimeout(closeAllTimerRef.current);
      closeAllTimerRef.current = null;
    }
  };

  const closePopup = (popupId: string) => {
    visibleIdsRef.current.delete(popupId);
    setPopupQueue(q => [...q]);

    if (itemTimersRef.current[popupId]) {
      clearTimeout(itemTimersRef.current[popupId]);
      delete itemTimersRef.current[popupId];
    }

    setTimeout(() => {
      setPopupQueue(q => {
        const next = q.filter(i => i.id !== popupId);
        if (next.length === 0) clearGroupCloseTimer();
        if (next.length > 0) {
          const nextItem = next[0];
          setTimeout(() => {
            visibleIdsRef.current.add(nextItem.id);
            setPopupQueue(q => [...q]);
          }, 10);
          const t = setTimeout(() => closePopup(nextItem.id), POPUP_AUTO_DISMISS_MS);
          itemTimersRef.current[nextItem.id] = t;
        }
        return next;
      });
    }, POPUP_TRANSITION_MS);
  };

  const enqueuePopup = (noti: Notification) => {
    if (!noti || !noti.id) {
      return;
    }
    const popupId = `${noti.id}-${Date.now()}`;
    const item: PopupItem = { id: popupId, noti };

    setPopupQueue(q => [...q, item]);

    setTimeout(() => {
      visibleIdsRef.current.add(popupId);
      setPopupQueue(q => [...q]);
    }, 10);

    const t = setTimeout(() => closePopup(popupId), POPUP_AUTO_DISMISS_MS);
    itemTimersRef.current[popupId] = t;

    startGroupCloseTimer();
  };

  // const getAuthHeaders = () => {
  //   const token = getAuthToken();
  //   return token ? {
  //     "Authorization": `Bearer ${token}`,
  //     "Content-Type": "application/json"
  //   } : {
  //     "Content-Type": "application/json"
  //   };
  // };

  const getNotificationId = (noti?: Notification | null) => noti?.id || "";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isUserRecipient = (_noti: Notification) => true;

  const startGroupCloseTimer = () => {
    if (closeAllTimerRef.current) {
      clearTimeout(closeAllTimerRef.current);
    }
    closeAllTimerRef.current = setTimeout(() => {
      closeAllPopups();
    }, POPUP_GROUP_AUTO_CLOSE_MS);
  };

  const toggleDropdown = () => {
    setIsOpen(prev => {
      setNotifying(false);
      return !prev;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(cur => cur === id ? null : id);
  };

  const handleMarkAllRead = () => {
    const profile = getProfile();
    if (!profile) {
      return;
    }
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnread(0);

    // localStorage.setItem(`notifications`, JSON.stringify(updated));
  };

  const handleMarkAsRead = (id: string) => {
    const profile = getProfile();
    if (!profile) {
      return;
    }
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setUnread(updated.filter(n => !n.read).length);

    // localStorage.setItem(`notifications`, JSON.stringify(updated));
  };

  const badgeCount = popupQueue.length > 0 ? popupQueue.length : unread;
  const filteredNotifications = notifications.filter(n => {
    const prefs = getPreferences();
    if (prefs.hideRead && n.read) {
      return false;
    }
    if (!isUserRecipient(n)) {
      return false;
    }
    if (filterType !== "All Types" && n.eventType.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    if (!searchTerm) {
      return true;
    }
    const term = searchTerm.toLowerCase();
    const caseId = n.data.find(d => d.key === "caseId")?.value || "";
    return caseId.toLowerCase().includes(term)
      || n.sender.toLowerCase().includes(term)
      || n.eventType.toLowerCase().includes(term)
      || n.message.toLowerCase().includes(term);
  });
  const profile = getProfile();
  const uniqueEventTypes = ["All Types", ...Array.from(new Set(notifications.map(n => n.eventType)))];
  const visibleNotifications = showAll ? filteredNotifications : filteredNotifications.slice(0, 5);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setUnread(notifications.filter(n => !n.read).length);
  }, [notifications, profile]);

  useEffect(() => {
    if (notifications.length > 0 && isOpen) {
      const latestNotification = notifications[0];
      if (latestNotification && !latestNotification.read) {
        const notificationList = document.querySelector(".custom-scrollbar");
        if (notificationList) {
          notificationList.scrollTop = 0;
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length, isOpen]);

  // Real-time timestamp update
  useEffect(() => {
    const interval = setInterval(() => {
      (Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // auto-delete by days on preferences
  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs.autoDelete) {
      return;
    }
    const now = Date.now();
    const filtered = notifications.filter(n => (now - new Date(n.createdAt).getTime()) / 86400000 < prefs.autoDeleteDays);
    if (filtered.length < notifications.length) {
      setNotifications(filtered);

      // if (profile) {
      //   localStorage.setItem(`notifications`, JSON.stringify(filtered));
      // }
    }
  }, [notifications, profile]);

  useEffect(() => {
    const newIsOverflow: { [key: string]: boolean } = {};
    filteredNotifications.forEach(noti => {
      const el = textRefs.current[noti.id];
      if (el) {
        newIsOverflow[noti.id] = el.scrollHeight > el.clientHeight + 1;
      }
    });
    const changed = Object.keys(newIsOverflow).some(k => newIsOverflow[k] !== isOverflow[k]);
    if (changed) {
      setIsOverflow(newIsOverflow);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredNotifications, expandedId]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    // if (profile) {
    //   const key = `notifications`;
    //   const existing = localStorage.getItem(key);
    //   if (existing === null) {
    //     localStorage.setItem(key, JSON.stringify(notifications));
    //   }
    // }
  }, [notifications, profile]);

  // ====== Use WebSocket from context instead of creating own socket ======
  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs.pushEnabled) {
      // console.log("Push notifications disabled by user preference.");
      return;
    }

    if (!profile?.username || !profile?.orgId) {
      return;
    }

    // Auto-connect if not connected
    // if (connectionState === 'disconnected') {
    //   connect({
    //     url: `${WEBSOCKET}/api/v1/notifications/register`,
    //     reconnectInterval: 5000,
    //     maxReconnectAttempts: 10,
    //     heartbeatInterval: 60000
    //   });
    // }

    // Subscribe to WebSocket messages
    const unsubscribe = onMessage(message => {
      try {
        const data: Notification = message.data;
        const prefs = getPreferences();

        if (data.eventType && data.message && data.eventType != "hidden") {
          // setNotifications(prev => {
          //   if (prev.some(n => n.id === data.id)) {
          //     return prev;
          //   }
          //   const updated = [{ ...data, read: false }, ...prev];
          //   if (profile) {
          //     localStorage.setItem(`notifications`, JSON.stringify(updated));
          //   }
          //   return updated;
          // });

          setNotifications(prev => {
            if (prev.some(n => n.id === data.id)) {
              return prev;
            }

            // const updated = [{ ...data, read: false }, ...prev].slice(0, MAX_NOTIFICATIONS);
            const updated = [{ ...data, read: false }, ...prev];

            if (profile) {
              try {
                // localStorage.setItem("notifications", JSON.stringify(updated));
              }
              catch (e) {
                if (e && typeof e === "object" && "name" in e && e.name === "QuotaExceededError") {
                  console.warn("LocalStorage quota exceeded, clearing old notifications...");

                  // Optionally, remove some old items
                  // updated.pop(); // Remove oldest
                  // localStorage.setItem("notifications", JSON.stringify(updated));
                }
                else {
                  console.error("Failed to save notifications:", e);
                }
              }
            }
            return updated;
          });

          setUnread(prev => prev + 1);

          if (prefs.popupEnabled) {
            enqueuePopup(data);
          }

          setNotifying(true);
          setTimeout(() => setNotifying(false), 3000);

          if (prefs.soundEnabled && audioRef.current) {
            const soundFile = `/sounds/${prefs.sound}.mp3`;
            audioRef.current.src = soundFile;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }

          if (isOpen) {
            setFilterType((current) => current);
          }
        }
      }
      catch (err) {
        console.error("Parse WebSocket message error:", message, err);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      Object.keys(itemTimersRef.current).forEach(id => {
        clearTimeout(itemTimersRef.current[id]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        delete itemTimersRef.current[id];
      });
      clearGroupCloseTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.username, profile?.orgId, onMessage, websocket, connectionState, isOpen]);

  const { data: getNotificationById } = useGetNotificationByIdQuery(profile.username, {
    skip: !profile.username,
    // refetchOnMountOrArgChange: true,
    // refetchOnFocus: true,
    // refetchOnReconnect: true,
    // pollingInterval: 60000
  });

  useEffect(() => {
    const loadNotifications = async () => {
      const profile = getProfile();
      const token = getAuthToken();
      if (!profile || !profile.username || !profile.orgId) {
        return;
      }

      // const key = `notifications`;
      // const saved = localStorage.getItem(key);
      // if (saved) {
      //   try {
      //     const parsed = JSON.parse(saved);
      //     if (Array.isArray(parsed)) {
      //       setNotifications(parsed);
      //       setUnread(parsed.filter((n: Notification) => !n.read).length);
      //       return;
      //     }
      //   }
      //   catch {
      //     //
      //   }
      // }

      if (!token) {
        return;
      }

      try {
        // const url = `${APP_CONFIG.API_BASE_URL}/notifications/${profile.orgId}/${profile.username}`;
        // const url = `${APP_CONFIG.API_BASE_URL_CMS}/notifications/${profile.orgId}/${profile.username}`;
        // const headers = getAuthHeaders();
        // const res = await axios.get(url, { headers });

        const res = getNotificationById;
        if (Array.isArray(res)) {
          const notificationsAsRead = res.map(noti => ({ ...noti, read: true }));
          setNotifications(notificationsAsRead as unknown as Notification[]);
          setUnread(0);
        }

        // if (Array.isArray(res.data)) {
        //   const notificationsAsRead = res.data.map((noti: Notification) => ({ ...noti, read: true }));
        //   setNotifications(notificationsAsRead);
        //   // localStorage.setItem(key, JSON.stringify(notificationsAsRead));
        //   setUnread(0);
        // }
      }
      catch (err) {
        // console.error("🚀 ~ loadNotifications ~ Fetch error:", err);
        
        if (err instanceof AxiosError) {
          // console.error("🚀 ~ loadNotifications ~ Response:", err.response?.data, err.response?.status);
        }
      }
    };

    loadNotifications();
  }, [getNotificationById]); 

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {popupQueue.length > 0 && (
        <div className={`${isSuper ? "top-15" : "top-6"} right-6 fixed z-9999`}>
          {(() => {
            const item = popupQueue[0];
            const { noti } = item;
            const isVisible = visibleIdsRef.current.has(item.id);
            
            // Determine color by delay or broadcast (same logic as dropdown)
            let borderColor = "";
            let badgeColor = "";
            const delay = noti.data?.find(d => d.key === "delay")?.value;
            if (delay === "1") {
              borderColor = "";
              badgeColor = "bg-gradient-to-r from-yellow-100 to-orange-100 dark:bg-gradient-to-r dark:from-yellow-900 dark:to-orange-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600";
            }
            else if (delay === "2") {
              borderColor = "";
              badgeColor = "bg-gradient-to-r from-red-100 to-pink-100 dark:bg-gradient-to-r dark:from-red-900 dark:to-pink-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600 animate-pulse";
            }
            else if (noti.eventType.toLowerCase() === "broadcast") {
              borderColor = "border-l-8 border-t-2 border-r-2 border-b-2 border-teal-500 dark:border-teal-400";
              badgeColor = "bg-gradient-to-r from-teal-100 to-cyan-100 dark:bg-gradient-to-r dark:from-teal-900 dark:to-cyan-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-600";
            }
            else {
              borderColor = "";
              badgeColor = "bg-gradient-to-r from-indigo-100 to-blue-100 dark:bg-gradient-to-r dark:from-indigo-900 dark:to-blue-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-600";
            }

            return (
              <div
                className={`relative w-90 rounded-xl bg-white dark:bg-gray-900 border shadow-2xl transition-all duration-300 ease-in-out ${borderColor}`}
                style={{
                  transform: `translateX(${isVisible ? "0" : "420px"})`,
                  opacity: isVisible ? 1 : 0,
                }}
              >
                {/* Counter Badge */}
                {popupQueue.length > 1 && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {popupQueue.length}
                    </span>
                  </div>
                )}

                {/* Close Button */}
                <button
                  className="absolute top-2 right-2 z-10 text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-900 rounded-full p-1 border border-gray-200 dark:border-gray-700 shadow"
                  aria-label="Close popup"
                  onClick={closeAllPopups}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Content - Same as dropdown notification item */}
                <div
                  className="cursor-pointer p-3"
                  onClick={() => {
                    const redirectFromData = noti.data?.find(d => d.key === "redirectURL")?.value;
                    const finalRedirectURL = noti.redirectURL || noti.redirectUrl || redirectFromData;
                    if (finalRedirectURL && finalRedirectURL.trim() !== "") {
                      navigate(finalRedirectURL);
                    }
                    closePopup(item.id);
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative shrink-0 mt-1">
                      {noti.eventType.toLowerCase() === "broadcast" && (!noti.senderPhoto || noti.senderPhoto.trim() === "") ? (
                        <div className="h-12 w-12 rounded-full border border-gray-300 dark:border-gray-600 bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                          <img 
                            src="/images/notification/broadcast.svg" 
                            alt="Broadcast" 
                            className="h-6 w-6"
                            style={{ filter: "invert(0.4) sepia(1) saturate(5) hue-rotate(120deg)" }}
                          />
                        </div>
                      ) : (
                        <img
                          src={noti.senderPhoto && noti.senderPhoto.trim() !== "" ? noti.senderPhoto : "/images/notification/user.jpg"}
                          alt="Sender"
                          className="h-12 w-12 rounded-full border border-gray-300 object-cover dark:border-gray-600"
                        />
                      )}
                    </div>

                    <div className="flex flex-col w-full gap-1">
                      <div className="flex justify-between items-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${badgeColor}`}
                        >
                          {noti.eventType}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                        <span className="font-semibold text-blue-800 dark:text-blue-300">{noti.sender}</span>{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">ส่งถึงคุณ</span>{" "}
                        <span className="text-gray-900 dark:text-gray-100">{noti.message}</span>
                      </div>

                      <div className="flex flex-col text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        <div className="flex justify-end items-center gap-1 mt-0.5">
                          <span className="font-mono text-gray-400 dark:text-gray-500">
                            {formatLastNotification(noti.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!noti.read && (
                    <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 opacity-20 pointer-events-none rounded-xl transition-all duration-200" />
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <audio ref={audioRef} src="/sound/defalut.mp3" preload="auto" />

      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className={`${
          isSuper ?
            "h-8 w-8 bg-[#1e293b] text-[#9CA3AF] hover:text-gray-300"
              :
            "h-11 w-11 text-gray-500 bg-white hover:text-gray-700 border border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white"
          } relative flex items-center justify-center rounded-full dark:bg-gray-900`
        }
        aria-label="Toggle notifications"
        type="button"
        title="Notifications"
      >
        <span className={`${isSuper ? "" : "border-2 border-white" } ${
          isConnected ?
            "bg-green-500"
              :
            "bg-red-500"
          } absolute bottom-0 right-0 z-40 h-3 w-3 rounded-full dark:border-gray-900`
        }></span>
        {notifying && (
          <span className="absolute right-0.5 top-1 z-10 h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        {badgeCount > 0 && (
          <span className={`absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full ${notifying ? "bg-red-500 animate-pulse" : "bg-blue-600"} text-xs font-bold text-white transition-all duration-300`}>
            {badgeCount}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(true)}
        className="absolute -right-60 mt-4.25 flex h-125 w-90 flex-col rounded-2xl p-4 bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("navigation.topbar.settings.notification.title")}
            </h5>
          </div>
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-xl font-bold mr-2">
              ⋯
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 dark:bg-gray-800">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setSearchMode(!searchMode)}
                      className={`${active ? "bg-gray-100 dark:bg-gray-700" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700 dark:text-white`}
                    >
                      🔍 {t("navigation.topbar.settings.notification.search")}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleMarkAllRead}
                      className={`${active ? "bg-indigo-50 dark:bg-indigo-900/50" : ""} flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left text-indigo-700 dark:text-indigo-300 rounded-md transition-colors`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("navigation.topbar.settings.notification.mark_all_as_read")}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-2 pb-2">
          {searchMode && (
            <input
              type="text"
              placeholder="🔍 Search notifications..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          )}
          <div className="relative">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {uniqueEventTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* List */}
        <ul className="flex flex-1 flex-col overflow-y-auto custom-scrollbar gap-0 -mx-1 pr-1">
          {visibleNotifications.length === 0 && (
            <li className="p-5 text-center text-gray-500 dark:text-gray-400 italic select-none">
              {t("navigation.topbar.settings.notification.no_notifications")}
            </li>
          )}

          {visibleNotifications.map((noti, index) => {
            // Determine color by delay or broadcast
            let borderColor = "";
            let badgeColor = "";
            const delay = noti.data?.find(d => d.key === "delay")?.value;
            if (delay === "1") {
              borderColor = "";
              badgeColor = "bg-gradient-to-r from-yellow-100 to-orange-100 dark:bg-gradient-to-r dark:from-yellow-900 dark:to-orange-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600";
            }
            else if (delay === "2") {
              borderColor = "";
              badgeColor = "bg-gradient-to-r from-red-100 to-pink-100 dark:bg-gradient-to-r dark:from-red-900 dark:to-pink-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600 animate-pulse";
            }
            else if (noti.eventType.toLowerCase() === "broadcast") {
              borderColor = "border-l-8 border-t-2 border-r-2 border-b-2 border-teal-500 dark:border-teal-400";
              badgeColor = "bg-gradient-to-r from-teal-100 to-cyan-100 dark:bg-gradient-to-r dark:from-teal-900 dark:to-cyan-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-600";
            }
            else {
              borderColor = "";
              badgeColor = "bg-gradient-to-r from-indigo-100 to-blue-100 dark:bg-gradient-to-r dark:from-indigo-900 dark:to-blue-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-600";
            }
            return (
              <li
                key={noti.id}
                className="relative cursor-pointer group"
                onClick={e => {
                  e.preventDefault();
                  if (!noti.read) {
                    handleMarkAsRead(noti.id);
                  }
                  const redirectFromData = noti.data?.find(d => d.key === "redirectURL")?.value;
                  const finalRedirectURL = noti.redirectURL || noti.redirectUrl || redirectFromData;
                  if (finalRedirectURL && finalRedirectURL.trim() !== "") {
                    navigate(finalRedirectURL);
                  }
                }}
              >
                <DropdownItem
                  className={`relative flex gap-2 p-2 px-3 py-2 rounded-xl
                    ${noti.read ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                    ${borderColor}
                    hover:bg-gray-100 dark:hover:bg-white/5
                    group-hover:shadow-sm transition-all duration-200
                    border
                    ${index !== filteredNotifications.length - 1 ? "border-b border-gray-100 dark:border-gray-800 group-hover:border-transparent" : ""}
                  `}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative shrink-0 mt-6">
                      {noti.eventType.toLowerCase() === "broadcast" && (!noti.senderPhoto || noti.senderPhoto.trim() === "") ? (
                        <div className="h-12 w-12 rounded-full border border-gray-300 dark:border-gray-600 bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                          <img 
                            src="/images/notification/broadcast.svg" 
                            alt="Broadcast" 
                            className="h-6 w-6"
                            style={{ filter: "invert(0.4) sepia(1) saturate(5) hue-rotate(120deg)" }}
                          />
                        </div>
                      ) : (
                        isValidImageUrl(noti.senderPhoto && noti.senderPhoto.trim() !== "" ? noti.senderPhoto : "/images/notification/user.jpg") ? (
                          <img
                            src={noti.senderPhoto && noti.senderPhoto.trim() !== "" ? noti.senderPhoto : "/images/notification/user.jpg"}
                            alt="Sender"
                            className="h-12 w-12 rounded-full border border-gray-300 object-cover dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            <span className="w-12 text-center capitalize">{noti.sender[0]}</span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex flex-col w-full gap-1">
                      <div className="flex justify-between items-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
                        >
                          {noti.eventType}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-relaxed relative">
                        <p
                          ref={el => { textRefs.current[noti.id] = el; }}
                          style={{
                            display: expandedId === noti.id ? "block" : "-webkit-box",
                            WebkitLineClamp: expandedId === noti.id ? "unset" : 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: 0,
                          }}
                        >
                          <span className="font-semibold text-blue-800 dark:text-blue-300">
                            {noti.sender}
                          </span>{" "}
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">ส่งถึงคุณ</span>{" "}
                          <span className="text-gray-900 dark:text-gray-100">{noti.message}</span>
                        </p>

                        {(isOverflow[noti.id] || expandedId === noti.id) && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleExpand(noti.id);
                            }}
                            className={`mt-1 ${expandedId === noti.id ? "text-red-500 dark:text-red-300" : "text-blue-500 dark:text-blue-300"} bg-white dark:bg-gray-900 px-1 rounded text-[10px]`}
                          >
                            {expandedId === noti.id ? "แสดงน้อยลง" : "แสดงทั้งหมด"}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        {getNotificationId(noti) && <span className="truncate max-w-full" />}
                        <div className="flex justify-end items-center gap-1 mt-0.5">
                          <span className="font-mono text-gray-400 dark:text-gray-500">
                            {formatLastNotification(noti.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!noti.read && (
                    <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 opacity-20 pointer-events-none rounded-2xl transition-all duration-200" />
                  )}
                </DropdownItem>
              </li>
            );
          })}
        </ul>

        <button
          className="block mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 w-full"
          onClick={() => setShowAll(prev => !prev)}
        >
          {showAll ? "Hide" : t("navigation.topbar.settings.notification.view_all_notifications")}
        </button>
      </Dropdown>
    </div>
  );
}

export default NotificationDropdown;
