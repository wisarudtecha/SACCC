// /src/pages/UiElements/Tabs.tsx
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import { Card } from "@/core/components/ui/card/Card";
import Tab from "@/core/components/ui/tab/Tab";
import type { TabItem } from "@/core/components/ui/tab/Tab";

// Icons
const OverviewIcon = () => <span>📊</span>;
const NotificationIcon = () => <span>🔔</span>;
const AnalyticsIcon = () => <span>📈</span>;
const CustomersIcon = () => <span>👥</span>;

const Tabs: React.FC = () => {
  // Common tab items
  const basicTabItems: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Overview</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Access the Shopify Admin panel to manage your online store. Here at this Shopify store we have efficient systems in place. 
            Therefore these are what you would consider efficient systems in place. Therefore these are what you would consider an efficient 
            system developed thus far.
          </p>
        </div>
      )
    },
    {
      id: 'notification',
      label: 'Notification',
      content: <div>Notification content goes here...</div>
    },
    {
      id: 'analytics',
      label: 'Analytics',
      content: <div>Analytics content goes here...</div>
    },
    {
      id: 'customers',
      label: 'Customers',
      content: <div>Customers content goes here...</div>
    }
  ];

  // Tab items with icons
  const iconTabItems: TabItem[] = basicTabItems.map((item, index) => ({
    ...item,
    icon: [<OverviewIcon />, <NotificationIcon />, <AnalyticsIcon />, <CustomersIcon />][index]
  }));

  // Tab items with badges
  const badgeTabItems: TabItem[] = [
    { ...basicTabItems[0], badge: '4' },
    { ...basicTabItems[1], badge: '2' },
    { ...basicTabItems[2], badge: '1' },
    { ...basicTabItems[3], badge: '12' }
  ];

  return (
    <div>
      <PageMeta
        title="React.js Tabs Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Tabs Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Tabs" />
      <div className="space-y-5 sm:space-y-6 cursor-default">
        {/* Default Tabs */}
        <Card header="Default Tabs" className="bg-white dark:bg-gray-800">
          <Card size="sm">
            <Tab items={basicTabItems} variant="default" />
          </Card>
        </Card>

        {/* Tabs with underline */}
        <Card header="Tabs with underline" className="bg-white dark:bg-gray-800">
          <Card size="sm">
            <Tab items={basicTabItems} variant="underline" />
          </Card>
        </Card>

        {/* Tabs with underline and icon */}
        <Card header="Tabs with underline and icon" className="bg-white dark:bg-gray-800">
          <Card size="sm">
            <Tab items={iconTabItems} variant="underline-icon" />
          </Card>
        </Card>

        {/* Tabs with badge */}
        <Card header="Tabs with badge" className="bg-white dark:bg-gray-800">
          <Card size="sm">
            <Tab items={badgeTabItems} variant="badge" />
          </Card>
        </Card>

        {/* Vertical Tabs */}
        <Card header="Vertical Tabs" className="bg-white dark:bg-gray-800">
          <Card size="sm">
            <Tab 
              items={iconTabItems.map(item => ({ ...item, badge: Math.floor(Math.random() * 10) + 1 }))} 
              orientation="vertical" 
            />
          </Card>
        </Card>
      </div>
    </div>
  );
}

export default Tabs;
