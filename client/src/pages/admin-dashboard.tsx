import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, Users, Building2, Receipt, FileCheck, 
  Settings, History, Shield, UserPlus, CheckCircle2, XCircle,
  Clock, TrendingUp, Activity, AlertCircle, Eye, Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [newAdminDialog, setNewAdminDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    fullName: "",
    fullNameAr: "",
    role: "customer_service",
    department: "customer_service",
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: merchantsData, isLoading: merchantsLoading } = useQuery({
    queryKey: ["/api/admin/merchants"],
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/admin/workflows"],
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
  });

  const { data: adminUsersData, isLoading: adminUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const updateMerchantStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/merchants/${id}/status`, { status, adminId: "admin" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "تم التحديث", description: "تم تحديث حالة التاجر بنجاح" });
    },
  });

  const reviewWorkflow = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: string; reviewNote?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/workflows/${id}/review`, { 
        status, 
        reviewerId: "admin",
        reviewNote 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "تم التحديث", description: "تم معالجة الطلب بنجاح" });
    },
  });

  const createAdmin = useMutation({
    mutationFn: async (data: typeof newAdmin) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setNewAdminDialog(false);
      setNewAdmin({ email: "", password: "", fullName: "", fullNameAr: "", role: "customer_service", department: "customer_service" });
      toast({ title: "تم الإنشاء", description: "تم إنشاء المستخدم الإداري بنجاح" });
    },
  });

  const dashData = dashboardData as any;
  const stats = dashData?.data?.stats || {};
  const recentMerchants = dashData?.data?.recentMerchants || [];
  const recentInvoices = dashData?.data?.recentInvoices || [];
  const recentWorkflows = dashData?.data?.recentWorkflows || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500">نشط</Badge>;
      case "pending": return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />قيد المراجعة</Badge>;
      case "suspended": return <Badge variant="destructive">موقوف</Badge>;
      case "approved": return <Badge className="bg-green-500">موافق</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; className: string }> = {
      // القيادة التنفيذية
      ceo: { label: "الرئيس التنفيذي", className: "bg-gradient-to-r from-amber-500 to-orange-600" },
      coo: { label: "مدير العمليات التنفيذي", className: "bg-gradient-to-r from-amber-400 to-orange-500" },
      cfo: { label: "المدير المالي", className: "bg-gradient-to-r from-amber-400 to-orange-500" },
      cpo: { label: "مدير المنتجات", className: "bg-gradient-to-r from-amber-400 to-orange-500" },
      // الإدارة الوسطى
      super_admin: { label: "مدير النظام", className: "bg-purple-600" },
      operations_manager: { label: "مدير العمليات", className: "bg-blue-600" },
      finance_manager: { label: "مدير المالية", className: "bg-emerald-600" },
      risk_manager: { label: "مدير المخاطر", className: "bg-red-600" },
      compliance_officer: { label: "مسؤول الامتثال", className: "bg-indigo-600" },
      // الأقسام التشغيلية
      customer_service: { label: "خدمة العملاء", className: "bg-sky-500" },
      customer_service_lead: { label: "قائد خدمة العملاء", className: "bg-sky-600" },
      accountant: { label: "محاسب", className: "bg-teal-500" },
      senior_accountant: { label: "محاسب أول", className: "bg-teal-600" },
      collections: { label: "التحصيل", className: "bg-orange-500" },
      collections_lead: { label: "قائد التحصيل", className: "bg-orange-600" },
      fraud_analyst: { label: "محلل الاحتيال", className: "bg-rose-600" },
      data_analyst: { label: "محلل البيانات", className: "bg-violet-500" },
      // إدارة التجار
      merchant_support: { label: "دعم التجار", className: "bg-cyan-500" },
      partnerships_manager: { label: "مدير الشراكات", className: "bg-cyan-600" },
      // إدارة الفروع
      branch_manager: { label: "مدير الفرع", className: "bg-lime-600" },
      assistant_branch_manager: { label: "مساعد مدير الفرع", className: "bg-lime-500" },
      cashier: { label: "أمين الصندوق", className: "bg-green-500" },
      // الجودة والتدقيق
      qa_specialist: { label: "أخصائي الجودة", className: "bg-fuchsia-500" },
      auditor: { label: "مدقق", className: "bg-slate-600" },
      internal_auditor: { label: "مدقق داخلي", className: "bg-slate-700" },
      // الموارد البشرية
      hr_manager: { label: "مدير الموارد البشرية", className: "bg-pink-600" },
      training_officer: { label: "مسؤول التدريب", className: "bg-pink-500" },
    };
    const roleInfo = roleLabels[role] || { label: role, className: "" };
    return <Badge className={roleInfo.className}>{roleInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">لوحة التحكم الإدارية</h1>
              <p className="text-muted-foreground">نظام إدارة "دربي"</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Activity className="h-4 w-4 ml-2 text-green-500" />
            النظام يعمل
          </Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 gap-1">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">الرئيسية</span>
            </TabsTrigger>
            <TabsTrigger value="merchants" data-testid="tab-merchants" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">التجار</span>
            </TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">العملاء</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices" className="flex items-center gap-1">
              <Receipt className="h-4 w-4" />
              <span className="hidden md:inline">الفواتير</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" data-testid="tab-workflows" className="flex items-center gap-1">
              <FileCheck className="h-4 w-4" />
              <span className="hidden md:inline">الموافقات</span>
            </TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team" className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:inline">الفريق</span>
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span className="hidden md:inline">السجلات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {dashboardLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="loading-dashboard">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card data-testid="card-total-users">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي العملاء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="stat-total-users">{stats.totalUsers || 0}</div>
                  </CardContent>
                </Card>
                <Card data-testid="card-active-merchants">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">التجار النشطين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600" data-testid="stat-active-merchants">{stats.activeMerchants || 0}</div>
                  </CardContent>
                </Card>
                <Card data-testid="card-pending-workflows">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">طلبات قيد المراجعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-500" data-testid="stat-pending-workflows">{stats.pendingWorkflows || 0}</div>
                  </CardContent>
                </Card>
                <Card data-testid="card-total-invoices">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الفواتير</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="stat-total-invoices">{stats.totalInvoices || 0}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    آخر التجار المسجلين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMerchants.slice(0, 5).map((merchant: any) => (
                      <div key={merchant.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{merchant.companyNameAr || merchant.companyName}</p>
                          <p className="text-sm text-muted-foreground">{merchant.merchantCode}</p>
                        </div>
                        {getStatusBadge(merchant.status)}
                      </div>
                    ))}
                    {recentMerchants.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">لا يوجد تجار بعد</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    طلبات تحتاج موافقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentWorkflows.filter((w: any) => w.status === "pending").slice(0, 5).map((workflow: any) => (
                      <div key={workflow.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{workflow.requestType}</p>
                          <p className="text-sm text-muted-foreground">{new Date(workflow.createdAt).toLocaleDateString("ar-SA")}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600"
                            onClick={() => reviewWorkflow.mutate({ id: workflow.id, status: "approved" })}
                            data-testid={`btn-approve-${workflow.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600"
                            onClick={() => reviewWorkflow.mutate({ id: workflow.id, status: "rejected" })}
                            data-testid={`btn-reject-${workflow.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {recentWorkflows.filter((w: any) => w.status === "pending").length === 0 && (
                      <p className="text-muted-foreground text-center py-4">لا توجد طلبات معلقة</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="merchants" className="space-y-4">
            <Card data-testid="card-merchants">
              <CardHeader>
                <CardTitle>إدارة التجار</CardTitle>
                <CardDescription>عرض وإدارة جميع التجار المسجلين في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                {merchantsLoading ? (
                  <div className="flex items-center justify-center py-8" data-testid="loading-merchants">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table data-testid="table-merchants">
                    <TableHeader>
                      <TableRow>
                        <TableHead>كود التاجر</TableHead>
                        <TableHead>اسم الشركة</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>العمولة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((merchantsData as any)?.data || []).map((merchant: any) => (
                        <TableRow key={merchant.id} data-testid={`row-merchant-${merchant.id}`}>
                          <TableCell className="font-mono" data-testid={`text-merchant-code-${merchant.id}`}>{merchant.merchantCode}</TableCell>
                          <TableCell data-testid={`text-merchant-name-${merchant.id}`}>{merchant.companyNameAr || merchant.companyName}</TableCell>
                          <TableCell>{merchant.contactEmail}</TableCell>
                          <TableCell data-testid={`badge-merchant-status-${merchant.id}`}>{getStatusBadge(merchant.status)}</TableCell>
                          <TableCell>{merchant.commissionRate}%</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {merchant.status === "pending" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => updateMerchantStatus.mutate({ id: merchant.id, status: "active" })}
                                  disabled={updateMerchantStatus.isPending}
                                  data-testid={`btn-activate-merchant-${merchant.id}`}
                                >
                                  {updateMerchantStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "تفعيل"}
                                </Button>
                              )}
                              {merchant.status === "active" && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => updateMerchantStatus.mutate({ id: merchant.id, status: "suspended" })}
                                  disabled={updateMerchantStatus.isPending}
                                  data-testid={`btn-suspend-merchant-${merchant.id}`}
                                >
                                  {updateMerchantStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إيقاف"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card data-testid="card-customers">
              <CardHeader>
                <CardTitle>إدارة العملاء</CardTitle>
                <CardDescription>عرض وإدارة حسابات العملاء والحدود الائتمانية</CardDescription>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="flex items-center justify-center py-8" data-testid="loading-customers">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table data-testid="table-customers">
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الجوال</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الحد الائتماني</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((customersData as any)?.data || []).slice(0, 20).map((customer: any) => (
                        <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                          <TableCell data-testid={`text-customer-name-${customer.id}`}>{customer.fullName}</TableCell>
                          <TableCell dir="ltr">{customer.phone}</TableCell>
                          <TableCell>{customer.email || "-"}</TableCell>
                          <TableCell data-testid={`text-credit-limit-${customer.id}`}>{customer.creditLimit?.toLocaleString()} ريال</TableCell>
                          <TableCell data-testid={`badge-customer-status-${customer.id}`}>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell>{new Date(customer.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card data-testid="card-invoices">
              <CardHeader>
                <CardTitle>إدارة الفواتير</CardTitle>
                <CardDescription>عرض جميع فواتير التقسيط في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-8" data-testid="loading-invoices">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table data-testid="table-invoices">
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الأقساط</TableHead>
                        <TableHead>المدفوع</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((invoicesData as any)?.data || []).slice(0, 20).map((invoice: any) => (
                        <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                          <TableCell className="font-mono" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.id.slice(0, 8)}</TableCell>
                          <TableCell>{invoice.userId}</TableCell>
                          <TableCell data-testid={`text-invoice-amount-${invoice.id}`}>{invoice.totalAmount?.toLocaleString()} ريال</TableCell>
                          <TableCell>{invoice.installmentMonths} أشهر</TableCell>
                          <TableCell>{invoice.paidInstallments || 0} / {invoice.installmentMonths}</TableCell>
                          <TableCell data-testid={`badge-invoice-status-${invoice.id}`}>{getStatusBadge(invoice.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <Card data-testid="card-workflows">
              <CardHeader>
                <CardTitle>طلبات الموافقة</CardTitle>
                <CardDescription>إدارة طلبات تفعيل التجار وتعديل الحدود الائتمانية</CardDescription>
              </CardHeader>
              <CardContent>
                {workflowsLoading ? (
                  <div className="flex items-center justify-center py-8" data-testid="loading-workflows">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table data-testid="table-workflows">
                    <TableHeader>
                      <TableRow>
                        <TableHead>نوع الطلب</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>الأولوية</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الطلب</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((workflowsData as any)?.data || []).map((workflow: any) => (
                        <TableRow key={workflow.id} data-testid={`row-workflow-${workflow.id}`}>
                          <TableCell data-testid={`text-workflow-type-${workflow.id}`}>{workflow.requestType}</TableCell>
                          <TableCell>{workflow.resourceType}: {workflow.resourceId?.slice(0, 8)}</TableCell>
                          <TableCell>
                            <Badge variant={workflow.priority === "high" ? "destructive" : "secondary"} data-testid={`badge-workflow-priority-${workflow.id}`}>
                              {workflow.priority}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`badge-workflow-status-${workflow.id}`}>{getStatusBadge(workflow.status)}</TableCell>
                          <TableCell>{new Date(workflow.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                          <TableCell>
                            {workflow.status === "pending" && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => reviewWorkflow.mutate({ id: workflow.id, status: "approved" })}
                                  disabled={reviewWorkflow.isPending}
                                  data-testid={`btn-approve-workflow-${workflow.id}`}
                                >
                                  {reviewWorkflow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "موافقة"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => reviewWorkflow.mutate({ id: workflow.id, status: "rejected" })}
                                  disabled={reviewWorkflow.isPending}
                                  data-testid={`btn-reject-workflow-${workflow.id}`}
                                >
                                  {reviewWorkflow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "رفض"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>فريق العمل</CardTitle>
                  <CardDescription>إدارة المستخدمين الإداريين والصلاحيات</CardDescription>
                </div>
                <Dialog open={newAdminDialog} onOpenChange={setNewAdminDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="btn-add-admin">
                      <UserPlus className="h-4 w-4 ml-2" />
                      إضافة مستخدم
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة مستخدم إداري جديد</DialogTitle>
                      <DialogDescription>أدخل بيانات المستخدم الجديد</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>الاسم (إنجليزي)</Label>
                          <Input 
                            value={newAdmin.fullName}
                            onChange={(e) => setNewAdmin({...newAdmin, fullName: e.target.value})}
                            data-testid="input-admin-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الاسم (عربي)</Label>
                          <Input 
                            value={newAdmin.fullNameAr}
                            onChange={(e) => setNewAdmin({...newAdmin, fullNameAr: e.target.value})}
                            data-testid="input-admin-name-ar"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>البريد الإلكتروني</Label>
                        <Input 
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                          data-testid="input-admin-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>كلمة المرور</Label>
                        <Input 
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                          data-testid="input-admin-password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>الدور</Label>
                          <Select value={newAdmin.role} onValueChange={(v) => setNewAdmin({...newAdmin, role: v})}>
                            <SelectTrigger data-testid="select-admin-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              <SelectItem value="ceo">الرئيس التنفيذي (CEO)</SelectItem>
                              <SelectItem value="coo">مدير العمليات التنفيذي (COO)</SelectItem>
                              <SelectItem value="cfo">المدير المالي (CFO)</SelectItem>
                              <SelectItem value="cpo">مدير المنتجات (CPO)</SelectItem>
                              <SelectItem value="super_admin">مدير النظام</SelectItem>
                              <SelectItem value="operations_manager">مدير العمليات</SelectItem>
                              <SelectItem value="finance_manager">مدير المالية</SelectItem>
                              <SelectItem value="risk_manager">مدير المخاطر</SelectItem>
                              <SelectItem value="compliance_officer">مسؤول الامتثال</SelectItem>
                              <SelectItem value="customer_service">خدمة العملاء</SelectItem>
                              <SelectItem value="customer_service_lead">قائد خدمة العملاء</SelectItem>
                              <SelectItem value="accountant">محاسب</SelectItem>
                              <SelectItem value="senior_accountant">محاسب أول</SelectItem>
                              <SelectItem value="collections">التحصيل</SelectItem>
                              <SelectItem value="collections_lead">قائد التحصيل</SelectItem>
                              <SelectItem value="fraud_analyst">محلل الاحتيال</SelectItem>
                              <SelectItem value="data_analyst">محلل البيانات</SelectItem>
                              <SelectItem value="merchant_support">دعم التجار</SelectItem>
                              <SelectItem value="partnerships_manager">مدير الشراكات</SelectItem>
                              <SelectItem value="branch_manager">مدير الفرع</SelectItem>
                              <SelectItem value="assistant_branch_manager">مساعد مدير الفرع</SelectItem>
                              <SelectItem value="cashier">أمين الصندوق</SelectItem>
                              <SelectItem value="qa_specialist">أخصائي الجودة</SelectItem>
                              <SelectItem value="auditor">مدقق</SelectItem>
                              <SelectItem value="internal_auditor">مدقق داخلي</SelectItem>
                              <SelectItem value="hr_manager">مدير الموارد البشرية</SelectItem>
                              <SelectItem value="training_officer">مسؤول التدريب</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>القسم</Label>
                          <Select value={newAdmin.department} onValueChange={(v) => setNewAdmin({...newAdmin, department: v})}>
                            <SelectTrigger data-testid="select-admin-department">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="executive">القيادة التنفيذية</SelectItem>
                              <SelectItem value="operations">العمليات</SelectItem>
                              <SelectItem value="finance">المالية</SelectItem>
                              <SelectItem value="risk">إدارة المخاطر</SelectItem>
                              <SelectItem value="compliance">الامتثال</SelectItem>
                              <SelectItem value="customer_service">خدمة العملاء</SelectItem>
                              <SelectItem value="collections">التحصيل</SelectItem>
                              <SelectItem value="fraud">مكافحة الاحتيال</SelectItem>
                              <SelectItem value="data">تحليل البيانات</SelectItem>
                              <SelectItem value="merchants">إدارة التجار</SelectItem>
                              <SelectItem value="branches">إدارة الفروع</SelectItem>
                              <SelectItem value="quality">الجودة</SelectItem>
                              <SelectItem value="audit">التدقيق</SelectItem>
                              <SelectItem value="hr">الموارد البشرية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => createAdmin.mutate(newAdmin)}
                        disabled={createAdmin.isPending}
                        data-testid="btn-create-admin"
                      >
                        {createAdmin.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {adminUsersLoading ? (
                  <div className="flex items-center justify-center py-8" data-testid="loading-team">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table data-testid="table-team">
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>القسم</TableHead>
                        <TableHead>آخر دخول</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((adminUsersData as any)?.data || []).map((admin: any) => (
                        <TableRow key={admin.id} data-testid={`row-admin-${admin.id}`}>
                          <TableCell data-testid={`text-admin-name-${admin.id}`}>{admin.fullNameAr || admin.fullName}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell data-testid={`badge-admin-role-${admin.id}`}>{getRoleBadge(admin.role)}</TableCell>
                          <TableCell>{admin.department || "-"}</TableCell>
                          <TableCell>
                            {admin.lastLoginAt 
                              ? new Date(admin.lastLoginAt).toLocaleDateString("ar-SA") 
                              : "لم يسجل دخول"}
                          </TableCell>
                          <TableCell data-testid={`badge-admin-status-${admin.id}`}>
                            {admin.isActive 
                              ? <Badge className="bg-green-500">نشط</Badge>
                              : <Badge variant="destructive">معطل</Badge>
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card data-testid="card-audit">
              <CardHeader>
                <CardTitle>سجل الأحداث</CardTitle>
                <CardDescription>تتبع جميع العمليات والتغييرات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex items-center justify-center py-8" data-testid="loading-audit">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table data-testid="table-audit">
                    <TableHeader>
                      <TableRow>
                        <TableHead>الإجراء</TableHead>
                        <TableHead>نوع المورد</TableHead>
                        <TableHead>المعرف</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((auditData as any)?.data || []).slice(0, 30).map((log: any) => (
                        <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-audit-action-${log.id}`}>{log.action}</Badge>
                          </TableCell>
                          <TableCell data-testid={`text-audit-resource-${log.id}`}>{log.resourceType}</TableCell>
                          <TableCell className="font-mono">{log.resourceId?.slice(0, 8) || "-"}</TableCell>
                          <TableCell>{log.description || "-"}</TableCell>
                          <TableCell>{new Date(log.createdAt).toLocaleString("ar-SA")}</TableCell>
                        </TableRow>
                      ))}
                      {((auditData as any)?.data || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            لا توجد سجلات بعد
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
