import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import ChatsPage from './pages/ChatsPage'
import MessagesPage from './pages/MessagesPage'
import UserContactsPage from './pages/UserContactsPage'
import ContactRequestsPage from './pages/ContactRequestsPage'
import CallsPage from './pages/CallsPage'
import CallSignalsPage from './pages/CallSignalsPage'
import QueryBuilderPage from './pages/QueryBuilderPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
    return (
        <MainLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/chats" element={<ChatsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/user-contacts" element={<UserContactsPage />} />
                <Route path="/contact-requests" element={<ContactRequestsPage />} />
                <Route path="/calls" element={<CallsPage />} />
                <Route path="/call-signals" element={<CallSignalsPage />} />
                <Route path="/query-builder" element={<QueryBuilderPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MainLayout>
    )
}
