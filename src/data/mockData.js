import { v4 as uuidv4 } from 'uuid'

// Generate mock users per PRD §3.1 Table 1
const mockUsers = [
    { id: 'user_001', email: 'ahmed@example.com', name: 'Ahmed Khan', display_name: 'Ahmed', avatar_url: '', photo_url: '', phone_number: '+923001234567', gender: 'Male', region: 'Punjab', address: 'Lahore, Pakistan', created_at: '2025-12-01T10:00:00Z', last_seen: '2026-02-12T08:30:00Z', is_online: true, status: 'Available', bio: 'Hey there! I am using AMIK CHAT', security_pin: '1234' },
    { id: 'user_002', email: 'fatima@example.com', name: 'Fatima Ali', display_name: 'Fatima', avatar_url: '', photo_url: '', phone_number: '+923009876543', gender: 'Female', region: 'Sindh', address: 'Karachi, Pakistan', created_at: '2025-12-05T14:00:00Z', last_seen: '2026-02-12T07:15:00Z', is_online: true, status: 'Busy', bio: 'Learning new things every day', security_pin: '5678' },
    { id: 'user_003', email: 'usman@example.com', name: 'Usman Raza', display_name: 'Usman', avatar_url: '', photo_url: '', phone_number: '+923451234567', gender: 'Male', region: 'KPK', address: 'Peshawar, Pakistan', created_at: '2025-12-10T09:00:00Z', last_seen: '2026-02-11T22:00:00Z', is_online: false, status: 'At work', bio: 'Software developer', security_pin: '9012' },
    { id: 'user_004', email: 'ayesha@example.com', name: 'Ayesha Bibi', display_name: 'Ayesha', avatar_url: '', photo_url: '', phone_number: '+923331234567', gender: 'Female', region: 'Punjab', address: 'Islamabad, Pakistan', created_at: '2025-12-15T16:00:00Z', last_seen: '2026-02-12T06:45:00Z', is_online: true, status: 'Available', bio: 'Graphic designer', security_pin: '3456' },
    { id: 'user_005', email: 'ali@example.com', name: 'Ali Hassan', display_name: 'Ali', avatar_url: '', photo_url: '', phone_number: '+923211234567', gender: 'Male', region: 'Balochistan', address: 'Quetta, Pakistan', created_at: '2025-12-20T11:00:00Z', last_seen: '2026-02-10T18:30:00Z', is_online: false, status: 'Away', bio: 'Explorer', security_pin: '7890' },
    { id: 'user_006', email: 'zainab@example.com', name: 'Zainab Noor', display_name: 'Zainab', avatar_url: '', photo_url: '', phone_number: '+923121234567', gender: 'Female', region: 'Sindh', address: 'Hyderabad, Pakistan', created_at: '2026-01-02T08:00:00Z', last_seen: '2026-02-12T09:00:00Z', is_online: true, status: 'Available', bio: 'Student', security_pin: '2345' },
    { id: 'user_007', email: 'bilal@example.com', name: 'Bilal Ahmed', display_name: 'Bilal', avatar_url: '', photo_url: '', phone_number: '+923081234567', gender: 'Male', region: 'Punjab', address: 'Multan, Pakistan', created_at: '2026-01-05T13:00:00Z', last_seen: '2026-02-11T20:00:00Z', is_online: false, status: 'Do not disturb', bio: 'Teacher', security_pin: '6789' },
    { id: 'user_008', email: 'hira@example.com', name: 'Hira Malik', display_name: 'Hira', avatar_url: '', photo_url: '', phone_number: '+923171234567', gender: 'Female', region: 'KPK', address: 'Abbottabad, Pakistan', created_at: '2026-01-10T10:30:00Z', last_seen: '2026-02-12T07:00:00Z', is_online: true, status: 'Available', bio: 'Photographer', security_pin: '0123' },
    { id: 'user_009', email: 'hamza@example.com', name: 'Hamza Tariq', display_name: 'Hamza', avatar_url: '', photo_url: '', phone_number: '+923261234567', gender: 'Male', region: 'Punjab', address: 'Faisalabad, Pakistan', created_at: '2026-01-15T15:00:00Z', last_seen: '2026-02-12T08:00:00Z', is_online: true, status: 'Available', bio: 'Engineer', security_pin: '4567' },
    { id: 'user_010', email: 'maryam@example.com', name: 'Maryam Shah', display_name: 'Maryam', avatar_url: '', photo_url: '', phone_number: '+923041234567', gender: 'Female', region: 'Sindh', address: 'Sukkur, Pakistan', created_at: '2026-01-20T12:00:00Z', last_seen: '2026-02-09T14:00:00Z', is_online: false, status: 'Away', bio: 'Writer', security_pin: '8901' },
]

// Generate mock chats per PRD §3.1 Table 2
const mockChats = [
    { id: 'chat_001', participant_ids: ['user_001', 'user_002'], participants_info: { user_001: { name: 'Ahmed Khan', avatar_url: '' }, user_002: { name: 'Fatima Ali', avatar_url: '' } }, last_message: { text: 'Salam! How are you?', sender_id: 'user_001', timestamp: '2026-02-12T08:25:00Z' }, created_at: '2025-12-05T15:00:00Z', updated_at: '2026-02-12T08:25:00Z', unread_count: { user_001: 0, user_002: 2 } },
    { id: 'chat_002', participant_ids: ['user_001', 'user_003'], participants_info: { user_001: { name: 'Ahmed Khan', avatar_url: '' }, user_003: { name: 'Usman Raza', avatar_url: '' } }, last_message: { text: 'Meeting at 3 PM', sender_id: 'user_003', timestamp: '2026-02-11T14:00:00Z' }, created_at: '2025-12-12T10:00:00Z', updated_at: '2026-02-11T14:00:00Z', unread_count: { user_001: 1, user_003: 0 } },
    { id: 'chat_003', participant_ids: ['user_002', 'user_004'], participants_info: { user_002: { name: 'Fatima Ali', avatar_url: '' }, user_004: { name: 'Ayesha Bibi', avatar_url: '' } }, last_message: { text: 'Check this design', sender_id: 'user_004', timestamp: '2026-02-12T06:40:00Z' }, created_at: '2025-12-18T09:00:00Z', updated_at: '2026-02-12T06:40:00Z', unread_count: { user_002: 3, user_004: 0 } },
    { id: 'chat_004', participant_ids: ['user_001', 'user_002', 'user_003', 'user_004'], participants_info: { user_001: { name: 'Ahmed Khan', avatar_url: '' }, user_002: { name: 'Fatima Ali', avatar_url: '' }, user_003: { name: 'Usman Raza', avatar_url: '' }, user_004: { name: 'Ayesha Bibi', avatar_url: '' } }, last_message: { text: 'Group project update', sender_id: 'user_001', timestamp: '2026-02-12T07:00:00Z' }, created_at: '2026-01-01T10:00:00Z', updated_at: '2026-02-12T07:00:00Z', unread_count: { user_001: 0, user_002: 5, user_003: 5, user_004: 2 } },
    { id: 'chat_005', participant_ids: ['user_005', 'user_006'], participants_info: { user_005: { name: 'Ali Hassan', avatar_url: '' }, user_006: { name: 'Zainab Noor', avatar_url: '' } }, last_message: { text: 'See you tomorrow!', sender_id: 'user_006', timestamp: '2026-02-10T18:00:00Z' }, created_at: '2026-01-05T12:00:00Z', updated_at: '2026-02-10T18:00:00Z', unread_count: { user_005: 1, user_006: 0 } },
]

// Generate mock messages per PRD §3.1 Table 3
const mockMessages = [
    { id: 'msg_001', chat_id: 'chat_001', sender_id: 'user_001', text: 'Salam! How are you?', timestamp: '2026-02-12T08:25:00Z', is_read: false, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: { '👍': ['user_002'] }, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_002', chat_id: 'chat_001', sender_id: 'user_002', text: 'Walaikum Assalam! I am fine, JazakAllah', timestamp: '2026-02-12T08:26:00Z', is_read: true, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_003', chat_id: 'chat_001', sender_id: 'user_001', text: null, timestamp: '2026-02-12T08:27:00Z', is_read: true, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'image', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: 'https://picsum.photos/400/300', location: null },
    { id: 'msg_004', chat_id: 'chat_002', sender_id: 'user_003', text: 'Meeting at 3 PM', timestamp: '2026-02-11T14:00:00Z', is_read: false, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: { '✅': ['user_001'] }, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_005', chat_id: 'chat_002', sender_id: 'user_001', text: 'OK, will be there', timestamp: '2026-02-11T14:05:00Z', is_read: true, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_006', chat_id: 'chat_003', sender_id: 'user_004', text: 'Check this design', timestamp: '2026-02-12T06:40:00Z', is_read: false, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'file', audio_url: null, duration: null, file_url: 'https://example.com/design.pdf', file_name: 'design_v2.pdf', file_size: 2048576, file_type: 'application/pdf', image_url: null, location: null },
    { id: 'msg_007', chat_id: 'chat_004', sender_id: 'user_001', text: 'Group project update', timestamp: '2026-02-12T07:00:00Z', is_read: false, is_deleted: false, is_forwarded: true, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: { '🔥': ['user_002', 'user_003'] }, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_008', chat_id: 'chat_001', sender_id: 'user_002', text: null, timestamp: '2026-02-12T08:30:00Z', is_read: false, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'audio', audio_url: 'https://example.com/voice.ogg', duration: 15, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_009', chat_id: 'chat_005', sender_id: 'user_006', text: 'See you tomorrow!', timestamp: '2026-02-10T18:00:00Z', is_read: true, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: { '❤️': ['user_005'] }, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_010', chat_id: 'chat_004', sender_id: 'user_002', text: null, timestamp: '2026-02-12T07:10:00Z', is_read: false, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'location', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: { lat: 31.5204, lng: 74.3587, label: 'Lahore' } },
    { id: 'msg_011', chat_id: 'chat_001', sender_id: 'user_001', text: 'Deleted message', timestamp: '2026-02-12T08:20:00Z', is_read: true, is_deleted: true, is_forwarded: false, deleted_for: { user_001: true }, deleted_at: '2026-02-12T08:21:00Z', deleted_by: 'user_001', reactions: {}, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
    { id: 'msg_012', chat_id: 'chat_003', sender_id: 'user_002', text: 'Which color scheme do you prefer?', timestamp: '2026-02-12T06:35:00Z', is_read: true, is_deleted: false, is_forwarded: false, deleted_for: {}, deleted_at: null, deleted_by: null, reactions: {}, type: 'text', audio_url: null, duration: null, file_url: null, file_name: null, file_size: null, file_type: null, image_url: null, location: null },
]

// Mock contact requests per PRD §3.1 Table 4
const mockContactRequests = [
    { id: 'req_001', from_user_id: 'user_001', to_user_id: 'user_005', from_name: 'Ahmed Khan', to_name: 'Ali Hassan', from_avatar_url: '', to_avatar_url: '', direction: 'sent', status: 'pending', created_at: '2026-02-10T10:00:00Z', updated_at: '2026-02-10T10:00:00Z' },
    { id: 'req_002', from_user_id: 'user_006', to_user_id: 'user_001', from_name: 'Zainab Noor', to_name: 'Ahmed Khan', from_avatar_url: '', to_avatar_url: '', direction: 'received', status: 'accepted', created_at: '2026-01-20T14:00:00Z', updated_at: '2026-01-21T09:00:00Z' },
    { id: 'req_003', from_user_id: 'user_007', to_user_id: 'user_002', from_name: 'Bilal Ahmed', to_name: 'Fatima Ali', from_avatar_url: '', to_avatar_url: '', direction: 'sent', status: 'rejected', created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-02T12:00:00Z' },
    { id: 'req_004', from_user_id: 'user_008', to_user_id: 'user_009', from_name: 'Hira Malik', to_name: 'Hamza Tariq', from_avatar_url: '', to_avatar_url: '', direction: 'sent', status: 'pending', created_at: '2026-02-11T16:00:00Z', updated_at: '2026-02-11T16:00:00Z' },
    { id: 'req_005', from_user_id: 'user_010', to_user_id: 'user_004', from_name: 'Maryam Shah', to_name: 'Ayesha Bibi', from_avatar_url: '', to_avatar_url: '', direction: 'sent', status: 'pending', created_at: '2026-02-12T05:00:00Z', updated_at: '2026-02-12T05:00:00Z' },
]

// Mock user contacts per PRD §3.1 Table 5
const mockUserContacts = [
    { user_id: 'user_001', contact_id: 'user_002', contact_name: 'Fatima Ali', contact_avatar_url: '', added_at: '2025-12-05T15:00:00Z' },
    { user_id: 'user_002', contact_id: 'user_001', contact_name: 'Ahmed Khan', contact_avatar_url: '', added_at: '2025-12-05T15:00:00Z' },
    { user_id: 'user_001', contact_id: 'user_003', contact_name: 'Usman Raza', contact_avatar_url: '', added_at: '2025-12-12T10:00:00Z' },
    { user_id: 'user_003', contact_id: 'user_001', contact_name: 'Ahmed Khan', contact_avatar_url: '', added_at: '2025-12-12T10:00:00Z' },
    { user_id: 'user_002', contact_id: 'user_004', contact_name: 'Ayesha Bibi', contact_avatar_url: '', added_at: '2025-12-18T09:00:00Z' },
    { user_id: 'user_004', contact_id: 'user_002', contact_name: 'Fatima Ali', contact_avatar_url: '', added_at: '2025-12-18T09:00:00Z' },
    { user_id: 'user_005', contact_id: 'user_006', contact_name: 'Zainab Noor', contact_avatar_url: '', added_at: '2026-01-05T12:00:00Z' },
    { user_id: 'user_006', contact_id: 'user_005', contact_name: 'Ali Hassan', contact_avatar_url: '', added_at: '2026-01-05T12:00:00Z' },
]

// Mock calls per PRD §3.1 Table 6
const mockCalls = [
    { id: 'call_001', participants: ['user_001', 'user_002'], is_video: false, status: 'ended', created_at: '2026-02-11T20:00:00Z' },
    { id: 'call_002', participants: ['user_001', 'user_003'], is_video: true, status: 'ended', created_at: '2026-02-11T14:30:00Z' },
    { id: 'call_003', participants: ['user_004', 'user_002'], is_video: false, status: 'active', created_at: '2026-02-12T08:00:00Z' },
    { id: 'call_004', participants: ['user_005', 'user_006'], is_video: true, status: 'missed', created_at: '2026-02-10T17:00:00Z' },
]

// Mock call signals per PRD §3.1 Table 7
const mockCallSignals = [
    { id: 'sig_001', call_id: 'call_001', type: 'offer', data: { sdp: 'v=0\no=- 12345 2 IN IP4 127.0.0.1...', type: 'offer' }, from_user_id: 'user_001', to_user_id: 'user_002', timestamp: '2026-02-11T20:00:01Z' },
    { id: 'sig_002', call_id: 'call_001', type: 'answer', data: { sdp: 'v=0\no=- 67890 2 IN IP4 127.0.0.1...', type: 'answer' }, from_user_id: 'user_002', to_user_id: 'user_001', timestamp: '2026-02-11T20:00:03Z' },
    { id: 'sig_003', call_id: 'call_001', type: 'ice-candidate', data: { candidate: 'candidate:1 1 udp 2113937151...', sdpMid: '0' }, from_user_id: 'user_001', to_user_id: 'user_002', timestamp: '2026-02-11T20:00:05Z' },
    { id: 'sig_004', call_id: 'call_002', type: 'offer', data: { sdp: 'v=0\no=- 11111 2 IN IP4 127.0.0.1...', type: 'offer' }, from_user_id: 'user_001', to_user_id: 'user_003', timestamp: '2026-02-11T14:30:01Z' },
    { id: 'sig_005', call_id: 'call_003', type: 'offer', data: { sdp: 'v=0\no=- 22222 2 IN IP4 127.0.0.1...', type: 'offer' }, from_user_id: 'user_004', to_user_id: 'user_002', timestamp: '2026-02-12T08:00:01Z' },
    { id: 'sig_006', call_id: 'call_003', type: 'answer', data: { sdp: 'v=0\no=- 33333 2 IN IP4 127.0.0.1...', type: 'answer' }, from_user_id: 'user_002', to_user_id: 'user_004', timestamp: '2026-02-12T08:00:03Z' },
]

export {
    mockUsers,
    mockChats,
    mockMessages,
    mockContactRequests,
    mockUserContacts,
    mockCalls,
    mockCallSignals,
}
