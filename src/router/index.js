import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'catalog', component: () => import('@/views/public/CatalogView.vue') },
      {
        path: 'producto/:id',
        name: 'product-detail',
        component: () => import('@/views/public/ProductDetailView.vue'),
      },
      { path: 'carrito', name: 'cart', component: () => import('@/views/public/CartView.vue') },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('@/views/public/CheckoutView.vue'),
      },
      {
        path: 'pedido/:id',
        name: 'order-confirmation',
        component: () => import('@/views/public/OrderConfirmationView.vue'),
      },
    ],
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      {
        path: 'productos',
        name: 'admin-products',
        component: () => import('@/views/admin/ProductsView.vue'),
      },
      {
        path: 'lotes',
        name: 'admin-purchase-lots',
        component: () => import('@/views/admin/PurchaseLotsView.vue'),
      },
      { path: 'pedidos', name: 'admin-orders', component: () => import('@/views/admin/OrdersView.vue') },
      {
        path: 'metodos-pago',
        name: 'admin-payment-methods',
        component: () => import('@/views/admin/PaymentMethodsView.vue'),
      },
      {
        path: 'reportes',
        name: 'admin-sales-report',
        component: () => import('@/views/admin/SalesReportView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (!auth.user) return { name: 'admin-login', query: { redirect: to.fullPath } }
  return true
})

export default router
