// src/cc/components/workspace/Email.tsx
"use client"

import { useState } from "react";
import { Archive, Forward, Reply, SearchIcon, Trash2 } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { Avatar, AvatarFallback } from "@/cc/components/ui/Avatar";

const Email = () => {
  const [selectedEmail, setSelectedEmail] = useState("1");
  const [emails] = useState([
    {
      id: "1",
      from: "customer@example.com",
      subject: "Service Request - Vehicle Breakdown",
      preview: "My vehicle broke down on the highway. I need urgent assistance...",
      time: "10:30 AM",
      unread: true,
      body: "My vehicle broke down on the highway near Mile 45. I need urgent assistance. Please send a tow truck as soon as possible. My vehicle is a blue Honda Civic, license plate ABC-1234.",
    },
    {
      id: "2",
      from: "support@company.com",
      subject: "Service Confirmation",
      preview: "Your service request has been confirmed for tomorrow...",
      time: "9:15 AM",
      unread: false,
      body: "Thank you for contacting us. Your service request has been confirmed for tomorrow at 10:00 AM. Our technician will be arriving at your location.",
    },
    {
      id: "3",
      from: "billing@company.com",
      subject: "Invoice #INV-2024-001",
      preview: "Your invoice for recent service is ready...",
      time: "Yesterday",
      unread: false,
      body: "Please find attached your invoice for the recent service. Total amount due: $250.00. Payment is due within 30 days.",
    },
  ]);

  return (
    <div className="flex-1 flex h-full dark:bg-black">
      {/* Email List */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search emails..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600"
            />
          </div>
        </div>

        {/* Email Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-4 pt-3">
          {[
            { id: "inbox", label: "Inbox" },
            { id: "sent", label: "Sent" },
            { id: "archive", label: "Archive" },
          ].map(tab => (
            <button
              key={tab.id}
              className="px-3 py-2 text-xs font-medium border-b-2 transition-colors border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-100 dark:hover:text-white"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email Items */}
        <div className="flex-1 overflow-y-auto">
          {emails.map(email => (
            <button
              key={email.id}
              onClick={() => setSelectedEmail(email.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900 transition-colors ${
                selectedEmail === email.id ? "bg-white dark:bg-gray-900" : ""
              } ${email.unread ? "bg-blue-900/20" : ""}`}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10 mt-1">
                  <AvatarFallback className="bg-blue-300 dark:bg-blue-600">{email.from.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-black dark:text-white truncate">{email.from}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{email.time}</span>
                  </div>
                  <p className="text-sm font-medium text-black dark:text-white truncate">{email.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email.preview}</p>
                </div>
                {email.unread && <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full shrink-0 mt-2" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col dark:bg-black">
        {/* Email Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4">
          {(() => {
            const email = emails.find(e => e.id === selectedEmail)
            return (
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white mb-2">{email?.subject}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-blue-300 dark:bg-blue-600">{email?.from.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-black dark:text-white font-medium">{email?.from}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{email?.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Reply className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {(() => {
            const email = emails.find(e => e.id === selectedEmail)
            return (
              <div className="max-w-3xl">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 text-black dark:text-white text-sm leading-relaxed">{email?.body}</div>

                {/* Reply Box */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Reply</h3>
                  <textarea
                    placeholder="Type your reply here..."
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600"
                    rows={4}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button className="bg-blue-300 dark:bg-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700">Send Reply</Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
                    >
                      Save Draft
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  );
}

export default Email;
