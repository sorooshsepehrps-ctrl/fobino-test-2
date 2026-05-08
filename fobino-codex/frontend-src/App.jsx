import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import './index.css';

import { DashboardLayout, AuthLayout, PublicLayout } from './components/layout';
import AppErrorBoundary from './components/common/AppErrorBoundary';

import Landing from './pages/Landing';
import CategoriesPage from './pages/marketplace/CategoriesPage';
import PostsPage from './pages/marketplace/PostsPage';
import SellPostDetailPage from './pages/marketplace/SellPostDetailPage';
import { Login, Verify } from './pages/auth';
import {
  MyFobino,
  Profile,
  Subscription,
  ProducerVerification,
  Verification,
  Tickets,
  NewTicket,
  Messages,
  Collaboration,
  Products,
  NewProduct,
  ProductExcel,
  SuggestedBuyers,
  BuyRequests,
  NewBuyRequest,
  BuyRequestExcel,
  Wallet,
  MyPostsChats,
  ChatPage,
  Marketplace,
  MyPosts,
  NewPost,
  AdminPanel,
} from './pages/dashboard';

import MarketingDashboard from './pages/dashboard/marketing/MarketingDashboard';
import MarketerVerification from './pages/dashboard/marketing/MarketerVerification';
import ProcessStatus from './pages/dashboard/marketing/ProcessStatus';
import NewMarketingRequest from './pages/dashboard/marketing/seller/NewMarketingRequest';
import MyMarketingRequests from './pages/dashboard/marketing/seller/MyMarketingRequests';
import MarketingRequestDetails from './pages/dashboard/marketing/seller/MarketingRequestDetails';
import MarketingRequestsForMarketers from './pages/dashboard/marketing/marketer/MarketingRequestsForMarketers';
import MyAcceptedRequests from './pages/dashboard/marketing/marketer/MyAcceptedRequests';
import CreateRFP from './pages/dashboard/marketing/marketer/CreateRFP';
import MyRFPs from './pages/dashboard/marketing/MyRFPs';
import RFPDetail from './pages/dashboard/marketing/RFPDetail';
import MyContracts from './pages/dashboard/marketing/MyContracts';
import TradeContractDetail from './pages/dashboard/marketing/TradeContractDetail';
import ConnectToBuyerContract from './pages/dashboard/marketing/buyer/ConnectToBuyerContract';
import LavasoonHoldingPage from './pages/LavasoonHolding';
import PublicUserProfile from './pages/users/PublicUserProfile';
import UserAnalysisPage from './pages/users/UserAnalysisPage';

import DropshippingDashboard from './pages/dashboard/dropshipping/DropshippingDashboard';
import DropshippingVerification from './pages/dashboard/dropshipping/DropshippingVerification';
import ProviderPanel from './pages/dashboard/dropshipping/provider/ProviderPanel';
import ProviderProducts from './pages/dashboard/dropshipping/provider/ProviderProducts';
import ProviderProductDetail from './pages/dashboard/dropshipping/provider/ProviderProductDetail';
import ProviderProductForm from './pages/dashboard/dropshipping/provider/ProviderProductForm';
import ProviderRFPDetail from './pages/dashboard/dropshipping/provider/ProviderRFPDetail';
import ProviderFinance from './pages/dashboard/dropshipping/provider/ProviderFinance';
import DropshipperPanel from './pages/dashboard/dropshipping/dropshipper/DropshipperPanel';
import BrowseProducts from './pages/dashboard/dropshipping/dropshipper/BrowseProducts';
import CreateRFPRequest from './pages/dashboard/dropshipping/dropshipper/CreateRFPRequest';
import AcceptedProducts from './pages/dashboard/dropshipping/dropshipper/AcceptedProducts';
import DropshipperProductDetail from './pages/dashboard/dropshipping/dropshipper/DropshipperProductDetail';
import DropshipperRFPDetail from './pages/dashboard/dropshipping/dropshipper/DropshipperRFPDetail';
import DropshipperFinance from './pages/dashboard/dropshipping/dropshipper/DropshipperFinance';

import useAuthStore from './store/authStore';
import CreateRFPRequestPage from './pages/dashboard/dropshipping/dropshipper/CreateRFPRequestPage';

function PublicRoutesShell() {
  return <Outlet />;
}

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <AppErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route element={<PublicRoutesShell />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/posts" element={<PostsPage />} />
                       <Route path="/post/:slug" element={<SellPostDetailPage />} />
            <Route path="/lavasoon" element={<LavasoonHoldingPage />} />
            <Route path="/users/:identifier" element={<PublicUserProfile />} />
            <Route path="/users/:identifier/analysis" element={<UserAnalysisPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<Verify />} />
          </Route>
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<MyFobino />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="producer-verification" element={<ProducerVerification />} />
          <Route path="verification" element={<Verification />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="messages" element={<Messages />} />
          <Route path="chats/:chatId" element={<ChatPage />} />
          <Route path="my-posts-chats" element={<MyPostsChats />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/new" element={<NewTicket />} />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<NewProduct />} />
          <Route path="products/excel" element={<ProductExcel />} />
          <Route path="buyers" element={<SuggestedBuyers />} />
          <Route path="requests" element={<BuyRequests />} />
          <Route path="requests/new" element={<NewBuyRequest />} />
          <Route path="requests/excel" element={<BuyRequestExcel />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="my-posts" element={<MyPosts />} />
          <Route path="posts/new" element={<NewPost />} />

          <Route path="marketing" element={<MarketingDashboard />} />
          <Route path="marketing/process-status" element={<ProcessStatus />} />
          <Route path="marketing/marketer-verification" element={<MarketerVerification />} />
          <Route path="marketing/requests/new" element={<NewMarketingRequest />} />
          <Route path="marketing/my-requests" element={<MyMarketingRequests />} />
          <Route path="marketing/requests/:id" element={<MarketingRequestDetails />} />
          <Route path="marketing/browse-requests" element={<MarketingRequestsForMarketers />} />
          <Route path="marketing/accepted-requests" element={<MyAcceptedRequests />} />
          <Route path="marketing/rfps" element={<MyRFPs />} />
          <Route path="marketing/rfps/:id" element={<RFPDetail />} />
          <Route path="marketing/rfps/create/:requestId" element={<CreateRFP />} />
          <Route path="marketing/contracts" element={<MyContracts />} />
          <Route path="marketing/contracts/:id" element={<TradeContractDetail />} />
          <Route path="marketing/connect-contract" element={<ConnectToBuyerContract />} />

          <Route path="dropshipping" element={<DropshippingDashboard />} />
          <Route path="dropshipping/verification" element={<DropshippingVerification />} />

          <Route path="dropshipping/provider" element={<ProviderPanel />} />
          <Route path="dropshipping/provider/products" element={<ProviderProducts />} />
          <Route path="dropshipping/provider/products/new" element={<ProviderProductForm mode="create" />} />
          <Route path="dropshipping/provider/products/:id" element={<ProviderProductDetail />} />
          <Route path="dropshipping/provider/products/:id/edit" element={<ProviderProductForm mode="edit" />} />
          <Route path="dropshipping/provider/rfps/:id" element={<ProviderRFPDetail />} />
          <Route path="dropshipping/provider/finance" element={<ProviderFinance />} />

          <Route path="dropshipping/dropshipper" element={<DropshipperPanel />} />
          <Route path="dropshipping/dropshipper/products" element={<BrowseProducts />} />
          <Route path="dropshipping/dropshipper/accepted-products" element={<AcceptedProducts />} />
          <Route path="dropshipping/dropshipper/products/:id" element={<DropshipperProductDetail />} />
          <Route path="dropshipping/dropshipper/products/:id/request" element={<CreateRFPRequestPage />} />
          <Route path="dropshipping/dropshipper/rfps/:id" element={<DropshipperRFPDetail />} />
          <Route path="dropshipping/dropshipper/finance" element={<DropshipperFinance />} />

          <Route path="dropshipping/provider-panel" element={<Navigate to="/dashboard/dropshipping/provider" replace />} />
          <Route path="dropshipping/products" element={<Navigate to="/dashboard/dropshipping/provider/products" replace />} />
          <Route path="dropshipping/dropshipper-panel" element={<Navigate to="/dashboard/dropshipping/dropshipper" replace />} />
          <Route path="dropshipping/browse" element={<Navigate to="/dashboard/dropshipping/dropshipper/products" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
