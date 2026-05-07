// Marketing System Routes
// Add these to your main App.jsx router configuration

import { lazy } from 'react';

// Lazy load marketing pages for better performance
const MarketingDashboard = lazy(() => import('../pages/dashboard/marketing/MarketingDashboard'));
const MarketerVerification = lazy(() => import('../pages/dashboard/marketing/MarketerVerification'));

// Seller Pages
const NewMarketingRequest = lazy(() => import('../pages/dashboard/marketing/seller/NewMarketingRequest'));
const MyMarketingRequests = lazy(() => import('../pages/dashboard/marketing/seller/MyMarketingRequests'));
const SellerRequestDetail = lazy(() => import('../pages/dashboard/marketing/seller/SellerRequestDetail'));

// Marketer Pages
const MarketingRequestsForMarketers = lazy(() => import('../pages/dashboard/marketing/marketer/MarketingRequestsForMarketers'));
const MarketerAcceptedRequests = lazy(() => import('../pages/dashboard/marketing/marketer/MarketerAcceptedRequests'));
const MarketerRequestDetail = lazy(() => import('../pages/dashboard/marketing/marketer/MarketerRequestDetail'));
const CreateRFP = lazy(() => import('../pages/dashboard/marketing/marketer/CreateRFP'));

// RFP Pages
const MyRFPs = lazy(() => import('../pages/dashboard/marketing/MyRFPs'));
const RFPDetail = lazy(() => import('../pages/dashboard/marketing/RFPDetail'));

// Contract Pages
const MyContracts = lazy(() => import('../pages/dashboard/marketing/MyContracts'));
const TradeContractDetail = lazy(() => import('../pages/dashboard/marketing/TradeContractDetail'));

// Buyer Pages
const ConnectToBuyerContract = lazy(() => import('../pages/dashboard/marketing/buyer/ConnectToBuyerContract'));

export const marketingRoutes = [
  {
    path: '/dashboard/marketing',
    element: <MarketingDashboard />,
    title: 'داشبورد بازاریابی'
  },
  {
    path: '/dashboard/marketing/marketer-verification',
    element: <MarketerVerification />,
    title: 'تایید بازاریاب'
  },
  
  // Marketing Requests (Seller)
  {
    path: '/dashboard/marketing/requests/new',
    element: <NewMarketingRequest />,
    title: 'درخواست بازاریابی جدید'
  },
  {
    path: '/dashboard/marketing/my-requests',
    element: <MyMarketingRequests />,
    title: 'درخواست‌های بازاریابی من'
  },
  {
    path: '/dashboard/marketing/my-requests/:id',
    element: <SellerRequestDetail />,
    title: 'جزئیات درخواست بازاریابی'
  },
  
  // Marketer Pages
  {
    path: '/dashboard/marketing/browse-requests',
    element: <MarketingRequestsForMarketers />,
    title: 'مرور درخواست‌های بازاریابی',
    requiresMarketer: true
  },
  {
    path: '/dashboard/marketing/my-accepted-requests',
    element: <MarketerAcceptedRequests />,
    title: 'درخواست‌های پذیرفته شده',
    requiresMarketer: true
  },
  {
    path: '/dashboard/marketing/my-accepted-requests/:id',
    element: <MarketerRequestDetail />,
    title: 'جزئیات درخواست بازاریابی',
    requiresMarketer: true
  },
  {
    path: '/dashboard/marketing/rfps/create/:requestId',
    element: <CreateRFP />,
    title: 'ایجاد RFP'
  },
  
  // RFP Pages
  {
    path: '/dashboard/marketing/rfps',
    element: <MyRFPs />,
    title: 'RFP های من'
  },
  {
    path: '/dashboard/marketing/rfps/:id',
    element: <RFPDetail />,
    title: 'جزئیات RFP'
  },
  
  // Contract Pages
  {
    path: '/dashboard/marketing/contracts',
    element: <MyContracts />,
    title: 'قراردادهای تجاری'
  },
  {
    path: '/dashboard/marketing/contracts/:id',
    element: <TradeContractDetail />,
    title: 'جزئیات قرارداد'
  },
  
  // Buyer Pages
  {
    path: '/dashboard/marketing/connect-contract',
    element: <ConnectToBuyerContract />,
    title: 'اتصال به قرارداد'
  }
];

export default marketingRoutes;
