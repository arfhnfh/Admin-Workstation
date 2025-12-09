import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import LibraryHubPage from '@/modules/library/LibraryHubPage'
import AddLibraryItemPage from '@/modules/library/AddLibraryItemPage'
import StaffProfilePage from '@/modules/staff/StaffProfilePage'
import AdminStaffManagementPage from '@/modules/staff/AdminStaffManagementPage'
import TravelRequestPage from '@/modules/travel/TravelRequestPage'
import AdminTravelRequestsPage from '@/modules/travel/AdminTravelRequestsPage'
import VehicleRequestPage from '@/modules/vehicle/VehicleRequestPage'
import AdminVehicleRequestsPage from '@/modules/vehicle/AdminVehicleRequestsPage'
import LoginPage from '@/modules/auth/LoginPage'
import SignupPage from '@/modules/auth/SignupPage'
import { staffProfileLoader } from '@/modules/staff/loader'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <LoginPage />,
  },
  {
    path: '/auth/signup',
    element: <SignupPage />,
  },
  // Library routes - no auth required for now
  {
    path: '/library',
    element: <PortalLayout />,
    children: [
      {
        index: true,
        element: <LibraryHubPage />,
      },
      {
        path: 'manage',
        element: <AddLibraryItemPage />,
      },
    ],
  },
  // Protected routes - require auth
  {
    path: '/',
    element: (
      <RequireAuth>
        <PortalLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/staff" replace /> },
      {
        path: 'staff',
        element: <StaffProfilePage />,
        loader: staffProfileLoader,
      },
      {
        path: 'staff/:staffId',
        element: <StaffProfilePage />,
        loader: staffProfileLoader,
      },
      {
        path: 'travel-request',
        element: <TravelRequestPage />,
      },
      {
        path: 'vehicle-request',
        element: <VehicleRequestPage />,
      },
      {
        path: 'admin',
        children: [
          {
            path: 'staff',
            element: <AdminStaffManagementPage />,
          },
          {
            path: 'travel-requests',
            element: <AdminTravelRequestsPage />,
          },
          {
            path: 'vehicle-requests',
            element: <AdminVehicleRequestsPage />,
          },
          {
            path: 'staff/:staffId',
            element: <StaffProfilePage />,
            loader: staffProfileLoader,
          },
        ],
      },
    ],
  },
])

