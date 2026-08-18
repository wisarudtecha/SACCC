// /src/components/admin/system-configuration/property/PropertyManagement.tsx
import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Settings,
  X
} from "lucide-react";
import { AlertHexaIcon, CheckCircleIcon, GroupIcon, PieChartIcon } from "@/core/icons";
import Input from "@/core/components/form/input/InputField";
import Checkbox from "@/core/components/form/input/Checkbox";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";
import Badge from "@/core/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/core/components/ui/table";
import type { PropertyDefinition, PropertyAnalytics } from "@/cms/types/device";

// =============================
// ENHANCED DATA INTERFACES
// Building upon existing Property interface
// =============================

// =============================
// MOCK DATA
// =============================

const mockProperties: PropertyDefinition[] = [
  {
    id: "1",
    propId: "PROP-001",
    orgId: "org-1",
    en: "First Aid Certification",
    th: "ใบรับรองการปฐมพยาบาล",
    propertyCode: "CERT-FA-001",
    category: "certification",
    dataType: "date",
    active: true,
    description: "Basic first aid certification required for emergency response",
    validationRules: [
      { type: "required", value: "true", message: "First aid certification is required" }
    ],
    dependencies: [],
    lifecycle: {
      expirationPeriod: 24,
      renewalRequired: true,
      maintenanceSchedule: "annually",
      verificationLevel: "certified"
    },
    metadata: {
      priority: "high",
      costImpact: 500,
      trainingRequired: true,
      certificationBody: "Red Cross"
    },
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-08-15T10:30:00Z",
    createdBy: "admin",
    updatedBy: "system"
  },
  {
    id: "2",
    propId: "PROP-002",
    orgId: "org-1",
    en: "Fire Extinguisher",
    th: "เครื่องดับเพลิง",
    propertyCode: "EQUIP-FE-002",
    category: "equipment",
    dataType: "select",
    active: true,
    description: "Portable fire extinguisher for emergency response",
    validationRules: [
      { type: "required", value: "true", message: "Fire extinguisher type must be specified" }
    ],
    dependencies: [
      { propertyId: "1", condition: "requires", value: "valid" }
    ],
    lifecycle: {
      expirationPeriod: 12,
      renewalRequired: true,
      maintenanceSchedule: "monthly",
      verificationLevel: "supervisor-verified"
    },
    metadata: {
      priority: "critical",
      costImpact: 200,
      trainingRequired: false
    },
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-08-20T14:15:00Z",
    createdBy: "admin",
    updatedBy: "supervisor"
  },
  {
    id: "3",
    propId: "PROP-003",
    orgId: "org-1",
    en: "Radio Communication",
    th: "วิทยุสื่อสาร",
    propertyCode: "COMM-RC-003",
    category: "equipment",
    dataType: "boolean",
    active: true,
    description: "Two-way radio for team communication",
    validationRules: [],
    dependencies: [],
    lifecycle: {
      renewalRequired: false,
      verificationLevel: "self-reported"
    },
    metadata: {
      priority: "medium",
      costImpact: 150,
      trainingRequired: true
    },
    createdAt: "2024-03-10T11:00:00Z",
    updatedAt: "2024-08-25T16:45:00Z",
    createdBy: "manager",
    updatedBy: "admin"
  }
];

// const mockUnitProperties: UnitProperty[] = [
//   {
//     id: "1",
//     unitId: "unit-001",
//     propertyId: "1",
//     value: "2024-12-31",
//     status: "active",
//     verificationDate: "2024-08-15",
//     expirationDate: "2024-12-31",
//     verifiedBy: "supervisor-01",
//     evidence: ["cert-001.pdf"],
//     notes: "Renewed certification valid until end of year"
//   },
//   {
//     id: "2",
//     unitId: "unit-001",
//     propertyId: "2",
//     value: "Type A",
//     status: "maintenance",
//     verificationDate: "2024-08-01",
//     expirationDate: "2024-09-01",
//     verifiedBy: "tech-01",
//     evidence: ["inspect-001.jpg"],
//     notes: "Scheduled for maintenance next week"
//   },
//   {
//     id: "3",
//     unitId: "unit-002",
//     propertyId: "1",
//     value: "2025-06-30",
//     status: "active",
//     verificationDate: "2024-07-01",
//     expirationDate: "2025-06-30",
//     verifiedBy: "supervisor-02",
//     evidence: ["cert-002.pdf"],
//     notes: "Recently renewed with extended validity"
//   }
// ];

// =============================
// MAIN COMPONENT
// =============================

const PropertiesManagementComponent: React.FC = () => {
  // =============================
  // STATE MANAGEMENT
  // =============================
  
  const [activeTab, setActiveTab] = useState<"definitions" | "assignments" | "analytics">("definitions");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "en",
    direction: "asc"
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | "view" | "assign">("create");
  const [selectedProperty, setSelectedProperty] = useState<PropertyDefinition | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Mock analytics data
  const analytics: PropertyAnalytics = useMemo(() => ({
    totalProperties: mockProperties.length,
    activeProperties: mockProperties.filter(p => p.active).length,
    expiringSoon: 5,
    complianceRate: 87.5,
    categoryDistribution: [
      { category: "certification", count: 15 },
      { category: "equipment", count: 23 },
      { category: "skill", count: 8 },
      { category: "resource", count: 12 }
    ],
    usageStats: [
      { propertyId: "1", unitCount: 45 },
      { propertyId: "2", unitCount: 38 },
      { propertyId: "3", unitCount: 52 }
    ]
  }), []);

  // =============================
  // FILTERING & SORTING
  // =============================

  const filteredProperties = useMemo(() => {
    let filtered = [...mockProperties];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(prop => 
        prop.en.toLowerCase().includes(search) ||
        prop.th.toLowerCase().includes(search) ||
        prop.propertyCode.toLowerCase().includes(search) ||
        prop.description?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(prop => prop.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(prop => 
        selectedStatus === "active" ? prop.active : !prop.active
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof PropertyDefinition] as string;
      const bValue = b[sortConfig.key as keyof PropertyDefinition] as string;
      
      if (sortConfig.direction === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockProperties, searchTerm, selectedCategory, selectedStatus, sortConfig]);

  // =============================
  // EVENT HANDLERS
  // =============================

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const handleSelectProperty = useCallback((propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  }, [selectedProperties.length, filteredProperties]);

  const handleCreate = useCallback(() => {
    setSelectedProperty(null);
    setModalType("create");
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((property: PropertyDefinition) => {
    setSelectedProperty(property);
    setModalType("edit");
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((property: PropertyDefinition) => {
    setSelectedProperty(property);
    setModalType("view");
    setIsModalOpen(true);
  }, []);

  const handleAssign = useCallback(() => {
    setModalType("assign");
    setIsModalOpen(true);
  }, []);

  // const handleBulkDelete = useCallback(() => {
  //   // Implementation for bulk delete
  //   console.log("Deleting properties:", selectedProperties);
  //   setSelectedProperties([]);
  // }, [selectedProperties]);

  // =============================
  // UTILITY FUNCTIONS
  // =============================

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "equipment": return "🛠️";
      case "certification": return "📜";
      case "skill": return "🎯";
      case "resource": return "📦";
      case "capability": return "⚡";
      default: return "📋";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-800";
      case "inactive": return "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800";
      case "maintenance": return "text-yellow-500 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-800";
      case "expired": return "text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-800";
      default: return "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-500 dark:text-red-400";
      case "high": return "text-orange-500 dark:text-orange-400";
      case "medium": return "text-blue-500 dark:text-blue-400";
      case "low": return "text-gray-500 dark:text-gray-400";
      default: return "text-gray-500 dark:text-gray-400";
    }
  };

  // =============================
  // RENDER FUNCTIONS
  // =============================

  const renderTabNavigation = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <nav className="flex space-x-8">
        {[
          { id: "definitions", label: "Property Definitions", icon: Settings },
          { id: "assignments", label: "Unit Assignments", icon: GroupIcon },
          { id: "analytics", label: "Analytics", icon: PieChartIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as "definitions" | "assignments" | "analytics")}
            className={`
              flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === id 
                ? "border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400" 
                : "border-transparent text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  const renderToolbar = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <Input
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters Toggle */}
      <Button onClick={() => setShowFilters(!showFilters)} size="sm" variant="outline">
        <Filter className="w-4 h-4 mr-2" />
        <span className="mr-2">Filters</span>
        {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleCreate} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Property</span>
        </Button>

        {/*
        {selectedProperties.length > 0 && (
          <>
            <Button onClick={handleAssign} size="sm" variant="success">
              <Users className="w-4 h-4 mr-2" />
              <span>Assign ({selectedProperties.length})</span>
            </Button>

            <Button onClick={handleBulkDelete} size="sm" variant="error">
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Delete ({selectedProperties.length})</span>
            </Button>
          </>
        )}
        */}
      </div>
    </div>
  );

  const renderFilters = () => showFilters && (
    <div className="rounded-lg mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Category
        </label>
        <Select
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
          className="cursor-pointer"
          options={[
            { label: "All Categories", value: "all" },
            { label: "Equipment", value: "equipment" },
            { label: "Certification", value: "certification" },
            { label: "Skill", value: "skill" },
            { label: "Resource", value: "resource" },
            { label: "Capability", value: "capability" }
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Status
        </label>
        <Select
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value)}
          className="cursor-pointer"
          options={[
            { label: "All Status", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" }
          ]}
        />
      </div>

      <div className="flex items-end">
        <Button
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("all");
            setSelectedStatus("all");
          }}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>Clear Filters</span>
        </Button>
      </div>
    </div>
  );

  const renderPropertyTable = () => (
    <div className="rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 cursor-default">
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedProperties.length === filteredProperties.length}
                  onChange={handleSelectAll}
                  className="bg-white dark:bg-gray-900"
                />
              </TableCell>
              {[
                { key: "propertyCode", label: "Property Code" },
                { key: "th", label: "Name (TH)" },
                // { key: "en", label: "Name (EN)" },
                { key: "category", label: "Category" },
                { key: "priority", label: "Priority" },
                { key: "active", label: "Status" },
                { key: "actions", label: "Actions" }
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => key !== "actions" && handleSort(key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {key !== "actions" && sortConfig.key === key && (
                      sortConfig.direction === "asc" ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4 transform rotate-90" />
                    )}
                  </div>
                </th>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProperties.map((property) => (
              <TableRow key={property.id} className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <TableCell className="px-6 py-4">
                  <Checkbox
                    checked={selectedProperties.includes(property.id)}
                    onChange={() => handleSelectProperty(property.id)}
                    className="bg-white dark:bg-gray-900"
                  />
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getCategoryIcon(property.category)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {property.propertyCode}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {property.propId}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-gray-800 dark:text-gray-100">{property.th}</div>
                  {property.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</div>
                  )}
                </TableCell>
                {/*
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-gray-800 dark:text-gray-100">{property.en}</div>
                </TableCell>
                */}
                <TableCell className="px-6 py-4">
                  <Badge className="capitalize" color="primary" size="sm">
                    {property.category}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span className={`text-sm font-medium capitalize ${getPriorityColor(property.metadata.priority)}`}>
                    {property.metadata.priority}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={`capitalize ${getStatusColor(property.active ? "active" : "inactive")}`} size="sm">
                    {property.active ? (
                      <>
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Button onClick={() => handleView(property)} variant="primary" size="xs">
                      View
                    </Button>
                    <Button onClick={() => handleEdit(property)} variant="warning" size="xs">
                      Edit
                    </Button>
                    <Button onClick={() => console.log("Delete property:", property.id)} variant="outline" size="xs">
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">No properties found</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your search or filters</div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        {
          title: "Total Properties",
          value: analytics.totalProperties,
          icon: Settings,
          color: "text-blue-500 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-800"
        },
        {
          title: "Active Properties",
          value: analytics.activeProperties,
          icon: CheckCircleIcon,
          color: "text-green-500 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-800"
        },
        {
          title: "Expiring Soon",
          value: analytics.expiringSoon,
          icon: AlertHexaIcon,
          color: "text-yellow-500 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-800"
        },
        {
          title: "Compliance Rate",
          value: `${analytics.complianceRate}%`,
          icon: PieChartIcon,
          color: "text-purple-500 dark:text-purple-400",
          bgColor: "bg-purple-100 dark:bg-purple-800"
        }
      ].map((stat, index) => (
        <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className={`${stat.bgColor} p-3 rounded-lg mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // =============================
  // MAIN RENDER
  // =============================

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6">
      <div className="mx-auto w-full">
        <div className="space-y-6">
          {/* Tab Navigation */}
          {renderTabNavigation()}

          {/* Analytics Cards */}
          {activeTab === "analytics" && renderAnalytics()}

          {/* Toolbar */}
          {activeTab !== "analytics" && renderToolbar()}

          {/* Filters */}
          {activeTab !== "analytics" && renderFilters()}

          {/* Content */}
          {activeTab === "definitions" && renderPropertyTable()}
          
          {activeTab === "assignments" && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
              <GroupIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">Unit Property Matrix</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Assign properties to units and manage their lifecycle
              </p>
              <button
                onClick={handleAssign}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-300 hover:bg-blue-700 dark:hover:bg-blue-200 text-white dark:text-gray-900 rounded-lg transition-colors"
              >
                Open Assignment Matrix
              </button>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Category Distribution</h3>
                <div className="space-y-3">
                  {analytics.categoryDistribution.map((item) => (
                    <div key={item.category} className="items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(item.category)}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{item.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${(item.count / analytics.totalProperties) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Property Usage Stats</h3>
                <div className="space-y-3">
                  {analytics.usageStats.map((item) => {
                    const property = mockProperties.find(p => p.id === item.propertyId);
                    return (
                      <div key={item.propertyId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {property?.en || "Unknown Property"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {property?.propertyCode}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {item.unitCount} units
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            assigned
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Modal Placeholder */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900 dark:bg-white bg-opacity-50 flex items-center justify-center z-500000">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {modalType === "create" && "Create New Property"}
                    {modalType === "edit" && "Edit Property"}
                    {modalType === "view" && "Property Details"}
                    {modalType === "assign" && "Assign Properties to Units"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {modalType === "create" && "Property creation form will be implemented here"}
                    {modalType === "edit" && `Editing property: ${selectedProperty?.en}`}
                    {modalType === "view" && `Viewing property: ${selectedProperty?.en}`}
                    {modalType === "assign" && "Unit property assignment matrix will be implemented here"}
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-4 px-4 py-2 bg-gray-600 dark:bg-gray-300 hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesManagementComponent
