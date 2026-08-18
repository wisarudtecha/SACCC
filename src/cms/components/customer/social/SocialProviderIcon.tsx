// src/cms/components/customer/social/SocialProviderIcon.tsx
import { Facebook, Mail, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The icon and brand colour for a channel.
 *
 * Kept out of `SOCIAL_PROVIDERS` (`customerSocial.policy.ts`) on purpose: that module is
 * plain data shared with non-rendering code, in the same way `NOTE_CATEGORIES` holds no
 * labels. Presentation choices live here.
 *
 * An unrecognised `socialType` — a channel added backend-first, or written by another
 * client — falls back to a generic chat glyph rather than rendering nothing.
 */
const PROVIDER_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  LINE: {
    icon: MessageCircle,
    className: "text-green-800 bg-green-200 dark:bg-green-300",
  },
  FACEBOOK: {
    icon: Facebook,
    className: "text-blue-800 bg-blue-200 dark:bg-blue-300",
  },
  TEXTCHAT: {
    icon: MessagesSquare,
    className: "text-purple-800 bg-purple-200 dark:bg-purple-300",
  },
  PHONE: {
    icon: Phone,
    className: "text-blue-800 bg-blue-200 dark:bg-blue-300",
  },
  EMAIL: {
    icon: Mail,
    className: "text-red-800 bg-red-200 dark:bg-red-300",
  },
};

const FALLBACK = {
  icon: MessageCircle,
  className: "text-gray-700 bg-gray-200 dark:bg-gray-300",
};

interface SocialProviderIconProps {
  socialType: string;
  className?: string;
}

export const SocialProviderIcon = ({ socialType, className = "" }: SocialProviderIconProps) => {
  const { icon: Icon, className: tone } = PROVIDER_ICONS[socialType] ?? FALLBACK;

  return (
    <div className={`rounded-md p-1 ${tone} ${className}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
};

export default SocialProviderIcon;
