// src/cms/components/customer/social/SocialAvatar.tsx
import { useEffect, useState } from "react";
import { SocialProviderIcon } from "@/cms/components/customer/social/SocialProviderIcon";

interface SocialAvatarProps {
  socialType: string;
  socialName?: string;
  imgUrl?: string;
  className?: string;
}

/**
 * A social account's profile picture, with the channel icon as the fallback.
 *
 * The fallback is not defensive padding — `imgUrl` points at a provider CDN
 * (`profile.line-scdn.net`, `platform-lookaside.fbsbx.com`) whose URLs rotate and expire,
 * so a broken image is the expected steady state for an older link rather than an error.
 * `onError` switches to the icon instead of leaving a broken-image glyph.
 *
 * The `imgUrl` reset matters: without it a row that swapped to the fallback would stay
 * there after being edited to a working URL, since the failure flag would outlive the
 * prop that caused it.
 */
export const SocialAvatar = ({
  socialType,
  socialName,
  imgUrl,
  className = "w-10 h-10",
}: SocialAvatarProps) => {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [imgUrl]);

  if (!imgUrl || hasFailed) {
    return <SocialProviderIcon socialType={socialType} className="self-center" />;
  }

  return (
    <img
      src={imgUrl}
      alt={socialName || socialType}
      className={`${className} rounded-full object-cover shrink-0`}
      onError={() => setHasFailed(true)}
    />
  );
};

export default SocialAvatar;
