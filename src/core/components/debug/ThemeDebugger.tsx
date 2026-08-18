// /src/components/debug/ThemeDebugger.tsx
/**
 * @fileoverview Comprehensive Theme Debug Component
 * 
 * @description
 * Advanced debugging tool for the enhanced theme system. Provides visual
 * inspection of all theme tokens, interactive controls, component previews,
 * and accessibility testing. Only available in development mode.
 * 
 * @author Claude Sonnet 4
 * @version 1.0.0
 * @created 2025-08-08
 */

import { useState } from "react";
import {  
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  FileText,
  Bell,
  Sun,
  Moon,
  Palette
} from "lucide-react";
import { Card } from "@/core/components/ui/card/Card";
import { useTheme } from "@/core/hooks/useTheme";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";
import Label from "@/core/components/form/Label";

// Main Demo Component
const CaseManagementDemo = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const mockCases = [
    {
      id: "CMS-2025-001",
      title: "Financial Investigation",
      priority: "critical",
      status: "error",
      assignee: "John Smith",
      created: "2025-01-15",
      description: "High-priority financial fraud investigation requiring immediate attention."
    },
    {
      id: "CMS-2025-002", 
      title: "Compliance Review",
      priority: "high",
      status: "warning",
      assignee: "Sarah Johnson",
      created: "2025-01-14",
      description: "Quarterly compliance review with regulatory requirements."
    },
    {
      id: "CMS-2025-003",
      title: "Customer Complaint",
      priority: "normal",
      status: "info",
      assignee: "Mike Davis",
      created: "2025-01-13",
      description: "Customer service complaint requiring investigation and response."
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === "dark" ? "bg-gray-900 text-gray-50" :
      theme === "mioc" ? "bg-cyan-50 text-gray-900" :
      theme === "metthier" ? "bg-orange-50 text-gray-900" :
      "bg-gray-50 text-gray-900"
    }`}>
      <div className="container mx-auto p-6 space-y-8">

        {/* Header with Theme Switcher */}
        <Card className="mb-8 border-gray-200 cursor-default">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Case Management System</h1>
              <p className="text-gray-600">Component Library Demo - {theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "primary" : "outline"}
                size="sm"
                startIcon={<Sun className="h-4 w-4" />}
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "outline"}
                size="sm"
                startIcon={<Moon className="h-4 w-4" />}
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                variant={theme === "mioc" ? "primary" : "outline"}
                size="sm"
                startIcon={<Palette className="h-4 w-4" />}
                onClick={() => setTheme("mioc")}
              >
                MIOC
              </Button>
              <Button
                variant={theme === "metthier" ? "primary" : "outline"}
                size="sm"
                startIcon={<Palette className="h-4 w-4" />}
                onClick={() => setTheme("metthier")}
              >
                Metthier
              </Button>
            </div>
          </div>
        </Card>

        {/* Button Showcase */}
        <Card className="cursor-default" header={<h2 className="text-xl font-semibold border-b-gray-200">Button Components</h2>}>
          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-lg font-medium mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="emergency" startIcon={<AlertTriangle className="h-4 w-4" />}>Emergency</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="success" startIcon={<CheckCircle className="h-4 w-4" />}>Success</Button>
                <Button variant="warning" startIcon={<AlertTriangle className="h-4 w-4" />}>Warning</Button>
                <Button variant="error" startIcon={<Trash2 className="h-4 w-4" />}>Error</Button>
                <Button variant="info" startIcon={<Bell className="h-4 w-4" />}>Info</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-medium mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xxs">Extra Extra Small</Button>
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* Priority Levels */}
            <div>
              <h3 className="text-lg font-medium mb-3">Priority Levels</h3>
              <div className="flex flex-wrap gap-3">
                <Button priority="normal">Normal Priority</Button>
                <Button priority="high" variant="warning">High Priority</Button>
                <Button priority="critical" variant="emergency">Critical Priority</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-lg font-medium mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSubmit}
                >
                  {loading ? "Processing..." : "Submit Case"}
                </Button>
                <Button disabled>Disabled</Button>
                <Button startIcon={<Plus className="h-4 w-4" />}>With Left Icon</Button>
                <Button endIcon={<Edit className="h-4 w-4" />}>With Right Icon</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Input Showcase */}
        <Card className="cursor-default" header={<h2 className="text-xl font-semibold">Input Components</h2>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="case-number">Case Number</Label>
              <Input
                id="case-number"
                placeholder="Enter case number..."
                required
                onChange={() => {}}
              />
              <span className="text-gray-400 text-xs">Use format: CMS-YYYY-XXX</span>
            </div>

            <div>
              <Label htmlFor="assignee-email">Assignee Email</Label>
              <Input
                id="assignee-email"
                type="email"
                placeholder="Enter email address..."
                value="john.smith@company.com"
                onChange={() => {}}
              />
            </div>

            <div>
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                placeholder="Enter phone number..."
                className="border-success-500"
                onChange={() => {}}
              />
              <span className="text-gray-400 text-xs">Valid phone number format</span>
            </div>

            <div>
              <Label htmlFor="case-title">Case Title <span className="text-red-500">*</span></Label>
              
              <Input
                id="case-title"
                placeholder="Enter case title..."
                required
                className="border-red-500"
                onChange={() => {}}
              />
              <span className="text-gray-400 text-xs">This field is required</span>
            </div>

            <div>
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                className="border-warning-500"
                onChange={() => {}}
              />
              <span className="text-gray-400 text-xs">Case deadline approaching</span>
            </div>

            <div>
              <Label htmlFor="search-cases">Search Cases</Label>
              <Input
                id="search-cases"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Card Showcase */}
        <Card className="cursor-default" header={<h2 className="text-xl font-semibold">Card Components</h2>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Case Cards */}
            {mockCases.map((caseItem) => (
              <Card 
                key={caseItem.id}
                variant="interactive"
                status={caseItem.status as "success" | "warning" | "error" | "info" | "critical"}
                header={
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{caseItem.id}</h3>
                      <p className="text-sm opacity-70">{caseItem.title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      caseItem.priority === "critical" ? "bg-purple-100 text-purple-800" :
                      caseItem.priority === "high" ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {caseItem.priority}
                    </span>
                  </div>
                }
                footer={
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{caseItem.assignee}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{caseItem.created}</span>
                    </div>
                  </div>
                }
              >
                <p className="text-sm opacity-80 mb-4 min-h-10">{caseItem.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    startIcon={<Edit className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    startIcon={<CheckCircle className="h-4 w-4" />}
                  >
                    Review
                  </Button>
                </div>
              </Card>
            ))}

            {/* Loading Card Example */}
            <Card loading={true} />

            {/* Status Cards */}
            <Card variant="elevated" status="success">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Case Resolved</h3>
                <p className="text-sm opacity-70">Successfully closed 15 cases this week</p>
              </div>
            </Card>

            <Card variant="elevated" status="warning">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Attention Required</h3>
                <p className="text-sm opacity-70">5 cases approaching deadline</p>
              </div>
            </Card>
          </div>
        </Card>

        {/* Complex Case Management Interface */}
        <Card className="cursor-default" header={<h2 className="text-xl font-semibold">Case Management Interface</h2>}>
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between border-b pb-4">
              <div className="flex gap-2">
                <Button startIcon={<Plus className="h-4 w-4" />}>
                  New Case
                </Button>
                <Button variant="outline" startIcon={<Filter className="h-4 w-4" />}>
                  Filter
                </Button>
                <Button variant="outline" startIcon={<FileText className="h-4 w-4" />}>
                  Export
                </Button>
              </div>
              <Input
                placeholder="Search cases..."
                // leftIcon={<Search className="h-4 w-4" />}
                className="max-w-sm"
                onChange={() => {}}
              />
            </div>

            {/* Case Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card size="sm" className="text-center">
                <div className="text-2xl font-bold text-blue-600">23</div>
                <div className="text-sm text-gray-600">Active Cases</div>
              </Card>
              <Card size="sm" className="text-center">
                <div className="text-2xl font-bold text-orange-600">8</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </Card>
              <Card size="sm" className="text-center">
                <div className="text-2xl font-bold text-red-600">3</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </Card>
              <Card size="sm" className="text-center">
                <div className="text-2xl font-bold text-green-600">157</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="emergency" priority="critical" startIcon={<AlertTriangle className="h-4 w-4" />}>
                Emergency Escalation
              </Button>
              <Button variant="warning" startIcon={<Clock className="h-4 w-4" />}>
                Review Deadlines
              </Button>
              <Button variant="success" startIcon={<CheckCircle className="h-4 w-4" />}>
                Bulk Approve
              </Button>
              <Button variant="info" startIcon={<Bell className="h-4 w-4" />}>
                Send Notifications
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <Card className="text-center cursor-default">
          <p className="text-sm opacity-70">
            Case Management System Component Library Demo - Built with React, TypeScript, and Tailwind CSS
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={toggleTheme}>
              Toggle Theme
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reset Demo
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default CaseManagementDemo;
