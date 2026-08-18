import Input from "@/core/components/form/input/InputField";
import { COMMON_INPUT_CSS } from "@/cms/components/case/constants/caseConstants";
import { providerForCaseSource } from "@/cms/utils/customerSocial.policy";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { CaseFieldSectionProps } from "./types";
import type { DraftCustomerSocial } from "@/cms/types/customerSocial";

/**
 * The social account a case arrived on, shown when the contact method is a social channel.
 *
 * Sits alongside the phone field rather than replacing it — a case can have both, and a
 * LINE case that later gains a phone number should not lose either. Deliberately separate
 * from `CaseCustomerInput`: that component's phone handling encodes specific rules about
 * not re-targeting an explicit customer link, and widening it to a second identity type
 * would put both sets of rules in one tangle.
 *
 * Renders nothing for non-social sources, and nothing at all until the backend assigns
 * case-source ids to the providers (see `SocialProviderMeta.caseSourceId`).
 */
export const CaseSocialIdentityInput = ({ caseState, onCaseChange }: CaseFieldSectionProps) => {
    const { t } = useTranslation();

    const provider = providerForCaseSource(caseState?.source?.id);
    if (!provider) {
        return null;
    }

    const identity = caseState?.socialIdentity;

    const patch = (updates: Partial<DraftCustomerSocial>) => {
        onCaseChange({
            socialIdentity: {
                socialType: provider.id,
                socialId: "",
                socialName: "",
                ...identity,
                ...updates,
            },
        });
    };

    return (
        <div className="mx-3 text-gray-900 dark:text-gray-400">
            <div className="w-auto md:mr-0">
                <h3 className="my-2">{t(provider.idLabelKey)} :</h3>
                <Input
                    className={COMMON_INPUT_CSS}
                    value={identity?.socialId ?? ""}
                    placeholder={t(provider.idHintKey)}
                    onChange={event => patch({ socialId: event.target.value })}
                />
            </div>
            <div className="w-auto md:mr-0">
                <h3 className="my-2">{t("customer.social.account_name")} :</h3>
                <Input
                    className={COMMON_INPUT_CSS}
                    value={identity?.socialName ?? ""}
                    onChange={event => patch({ socialName: event.target.value })}
                />
            </div>
        </div>
    );
};
