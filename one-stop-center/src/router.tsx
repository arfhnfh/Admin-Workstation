import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import LibraryHubPage from '@/modules/library/LibraryHubPage'
import AddLibraryItemPage from '@/modules/library/AddLibraryItemPage'
import StaffProfilePage from '@/modules/staff/StaffProfilePage'
import AdminStaffManagementPage from '@/modules/staff/AdminStaffManagementPage'
// import TravelRequestPage from '@/modules/travel/TravelRequestPage' // Temporarily disabled due to JSX errors
import RoomBookingPage from '@/modules/room-booking/RoomBookingPage'
import AdminRoomBookingPage from '@/modules/room-booking/AdminRoomBookingPage'
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
        element: <LibraryHubPage />,
      },
      {
        path: 'collection',
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
      // Temporarily disabled due to JSX structure errors
      // {
      //   path: 'travel-request',
      //   element: <TravelRequestPage />,
      // },
      {
        path: 'room-booking',
        element: <RoomBookingPage />,
      },
      {
        path: 'admin',
        children: [
          {
            path: 'staff',
            element: <AdminStaffManagementPage />,
          },
          {
            path: 'staff/:staffId',
            element: <StaffProfilePage />,
            loader: staffProfileLoader,
          },
          {
            path: 'room-booking',
            element: <AdminRoomBookingPage />,
          },
        ],
      },
    ],
  },
])

