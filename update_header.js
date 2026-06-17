const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/Header.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace(
  'import styles from "./Header.module.scss";',
  'import { useSocket } from "./SocketProvider";\nimport { useNotificationStore } from "@/store/useNotificationStore";\nimport styles from "./Header.module.scss";'
);

// 2. Add logic
const logicStr = `  const socket = useSocket();
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = notifications.filter(n => !n.isRead && !n.isVisible && n.type === 'BOOK_REQUEST').length;

  const handleTestNotification = () => {
    const targetUserId = prompt("Nhập ID người dùng muốn gửi thông báo test:");
    if (targetUserId && socket) {
      socket.emit("test_send_notification", { targetUserId });
    }
  };

  const clearAuthState = useCallback(() => {`;

content = content.replace('  const clearAuthState = useCallback(() => {', logicStr);

// 3. Update Bell Icon & add Test Button
const bellTarget = `              <Link
                href="/requests"
                className={\`\${styles.chatIcon} \${pathname.startsWith("/requests") ? styles.chatIconActive : ""}\`}
                title="Quản lý lượt xin"
              >
                <Bell size={18} />
              </Link>`;

const bellReplace = `              <Link
                href="/requests"
                className={\`\${styles.chatIcon} \${pathname.startsWith("/requests") ? styles.chatIconActive : ""}\`}
                title="Quản lý lượt xin"
                onClick={() => useNotificationStore.getState().markAllAsRead()}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className={styles.chatBadge} />}
              </Link>
              <button 
                onClick={handleTestNotification} 
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}
                title="Test gửi thông báo"
              >
                Test
              </button>`;

content = content.replace(bellTarget, bellReplace);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated Header.tsx");
