// /src/components/admin/user-management/user/SkillMatrixView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckLineIcon, LockIcon } from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUserSkillsByUsernameQuery } from "@/core/store/api/userApi";
import type { Skill } from "@/cms/types/skill";
import type { UserSkill } from "@/core/types/user";
import Button from "@/core/components/ui/button/Button";

const SkillMatrixContent: React.FC<{
  loading: boolean;
  skills: Skill[];
  skillList: string[];
  userName: string;
  // userWithSkills: UserSkill[];
  handleUserSkillsSave: () => void;
  onUserSkillsToggle: (userName: string, skillId: string) => Promise<void>;
}> = ({
  loading,
  skills,
  skillList,
  userName,
  // userWithSkills,
  handleUserSkillsSave,
  onUserSkillsToggle,
}) => {
  const { language, t } = useTranslation();

  const { data: userWithSkillsData } = useGetUserSkillsByUsernameQuery(userName, { skip: !userName });
  const userWithSkills = useMemo(
    () => (userWithSkillsData?.data as unknown as UserSkill[]) || [],
    [userWithSkillsData?.data]
  );

  // Initialize skillList with user's current skills when data loads
  const [initializedUser, setInitializedUser] = useState<string>("");

  useEffect(() => {
    if (userName && userWithSkills.length > 0 && initializedUser !== userName) {
      // Initialize the parent's skillList with current user skills
      const currentSkillIds = userWithSkills.map(us => us.skillId);
      currentSkillIds.forEach(skillId => {
        onUserSkillsToggle(userName, skillId);
      });
      setInitializedUser(userName);
    }
  }, [userName, userWithSkills, initializedUser, onUserSkillsToggle]);

  // Reset initialization when user changes
  useEffect(() => {
    if (userName && userName !== initializedUser) {
      setInitializedUser("");
    }
  }, [userName, initializedUser]);

  const handleUserSkillsToggle = async (userName: string, skillId: string) => {
    try {
      onUserSkillsToggle(userName, skillId);
    }
    catch (error) {
      console.error("Error toggling user with skills:", error);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      const calculated = (window.innerHeight * 0.7) - 210;
      setMaxHeight(calculated);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto overflow-y-auto" ref={containerRef} style={{maxHeight}}>
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 cursor-default">
            <tr className="bg-gray-100 dark:bg-gray-800 z-100">
              <th
                className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider sticky left-0 bg-gray-100 dark:bg-gray-800 z-100"
                colSpan={2}
              >
                {t("crud.user.list.skill.update.title")}
              </th>

              {/*
              <th key={userName} className="px-3 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider min-w-24 bg-gray-100 dark:bg-gray-800 z-100">
                <div className="flex flex-col items-center">
                  <span className="tracking-wider max-w-20">
                    {userName}
                  </span>
                </div>
              </th>
              */}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {skills.map(skill => {
              // const hasSkill = userWithSkills?.some(userSkill => userSkill.skillId === skill.skillId);
              // Use skillList prop instead of userWithSkills for checkbox state
              const hasSkill = skillList.includes(skill.skillId);
              return (
                <tr
                  key={skill.skillId}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300`}
                >
                  <td className="px-6 py-4 sticky left-0 z-100">
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize indent-6">
                          {language === "th" && `${skill.th} (${skill.en})` || `${skill.en} (${skill.th})`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td key={`${userName}-${skill.skillId}`} className="px-3 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleUserSkillsToggle(userName, skill.skillId)}
                        disabled={!userName}
                        // className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                        //   ${
                        //     hasSkill
                        //       ? "bg-green-500 border-green-500 text-white"
                        //       : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        //   } "hover:border-green-400"}`}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                          ${
                            hasSkill
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          } ${!userName ? "opacity-50 cursor-not-allowed" : "hover:border-green-400 cursor-pointer"}`}
                      >
                        {hasSkill && <CheckLineIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {skills.length === 0 && (
        <div className="text-center py-12">
          <LockIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("crud.common.zero_records")}
          </h3>

          {/*
          <p className="text-gray-500 dark:text-gray-400">
            Create your first skill to get started.
          </p>
          */}
        </div>
      )}

      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => !loading && handleUserSkillsSave()}
              disabled={loading || !userName}
              className={loading || !userName ? "opacity-50 cursor-not-allowed" : ""}
            >
              {loading ? t("crud.user.list.skill.update.button.saving") : t("crud.user.list.skill.update.button.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillMatrixContent;
