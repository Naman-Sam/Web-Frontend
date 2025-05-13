import React, { useState, useEffect, useRef } from 'react';
import '../styles/OrderMessages.css';
import { io } from 'socket.io-client';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const OrderMessages = ({ orderId, senderId }) => {
  // State declarations
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  // Refs for context menu, socket connection, long press, scroll timeout, and touch starting point.
  const contextRef = useRef(null);
  const socketRef = useRef(null);
  const touchTimeout = useRef(null);
  const scrollTimeout = useRef(null);
  const touchStartPosition = useRef({ x: 0, y: 0 });

  // 1. Fetch messages for the order and close context menu when clicking outside.
  useEffect(() => {
    if (!orderId) return;
    const fetchMessages = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/messages/fetch/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json();
        if (response.ok) {
          setMessages(data.messages || []);
        } else {
          console.error('Failed to fetch messages:', data.message);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();

    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
        setSelectedMessage(null);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [orderId]);

  // 2. Auto-scroll to the bottom when messages update and manage auto-scroll based on the user's scroll.
  useEffect(() => {
    const container = document.querySelector('.messages-container-order');
    if (container && autoScrollEnabled) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, autoScrollEnabled]);

  useEffect(() => {
    const container = document.querySelector('.messages-container-order');
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setAutoScrollEnabled(distanceFromBottom <= 50);

      // Cancel any pending long press detection.
      cancelLongPress();

      // Mark as scrolling so long press won’t trigger.
      if (!isScrolling) setIsScrolling(true);

      // Reset long press ability only after 1.5 seconds of scroll inactivity.
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isScrolling]);

  // 3. Utility: Add a new message if it doesn’t already exist.
  const addMessage = (newMsgData) => {
    const newId = String(newMsgData.message_id || newMsgData.id);
    setMessages(prev => {
      if (prev.some(msg => String(msg.message_id || msg.id) === newId)) return prev;
      return [...prev, newMsgData];
    });
  };

  // 4. Setup Socket.IO: join the room and listen for live events.
  useEffect(() => {
    if (!orderId) return;
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinRoom', `order_${orderId}`);

    socketRef.current.on('newMessage', (messageData) => {
      if (!messageData.orderId || String(messageData.orderId) === String(orderId)) {
        addMessage(messageData);
      }
      console.log('New message received:', messageData);
    });

    socketRef.current.on('messageEdited', (updatedMessage) => {
      setMessages(prev =>
        prev.map(msg => {
          const msgId = String(msg.message_id || msg.id);
          const updatedId = String(updatedMessage.message_id || updatedMessage.id);
          return msgId === updatedId ? updatedMessage : msg;
        })
      );
      console.log('Edited message received:', updatedMessage);
    });

    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages(prev =>
        prev.filter(msg => String(msg.message_id || msg.id) !== String(messageId))
      );
      console.log('Message delete event received:', messageId);
    });

    socketRef.current.on('messageRead', (updatedMessage) => {
      setMessages(prev =>
        prev.map(msg => {
          const msgId = String(msg.message_id || msg.id);
          const updatedId = String(updatedMessage.message_id || updatedMessage.id);
          return msgId === updatedId ? updatedMessage : msg;
        })
      );
      console.log('Read status update received:', updatedMessage);
    });

    return () => socketRef.current.disconnect();
  }, [orderId]);

  // 5. Update read status for messages not from the current user.
  const updateReadStatus = async (messageId) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await response.json();
      if (response.ok) {
        const updated = data.updatedMessage[0];
        setMessages(prev =>
          prev.map(msg => {
            const id = String(msg.message_id || msg.id);
            if (id === String(messageId)) {
              return msg.messages
                ? { ...msg, messages: { ...msg.messages, read_status: updated.read_status } }
                : { ...msg, read_status: updated.read_status };
            }
            return msg;
          })
        );
      } else {
        console.error('Failed to update read status:', data.message);
      }
    } catch (err) {
      console.error('Error updating read status:', err);
    }
  };

  useEffect(() => {
    messages.forEach(msg => {
      const id = String(msg.message_id || msg.id);
      const sender = msg.messages ? msg.messages.sender : msg.sender;
      const readStatus = msg.messages ? msg.messages.read_status : msg.read_status;
      if (String(sender) !== String(senderId) && !readStatus) {
        updateReadStatus(id);
      }
    });
  }, [messages, senderId]);

  // 6. Group messages by creation date.
  const groupMessagesByDate = (msgs) =>
    msgs.reduce((acc, msg) => {
      const createdAt = msg.messages ? msg.messages.created_at : msg.created_at;
      if (!createdAt) return acc;
      const date = new Date(createdAt).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});
  const groupedMessages = groupMessagesByDate(messages);

  // 7. Handle file upload for image attachments.
  const handleFileUpload = (e) => {
    if (e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };
  const removeImagePreview = () => setImageFile(null);

  // 8. Send a new message.
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !imageFile) return;
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('sender_id', senderId);
    formData.append('message', newMessage);
    if (imageFile) formData.append('image', imageFile);
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/send`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        addMessage(data.messageData);
        setNewMessage('');
        setImageFile(null);
      } else {
        console.error('Failed to send message:', data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // 9. Context menu handler (for both right-click and long press).
  const handleContextMenu = (event, msg) => {
    event.preventDefault();
    const posX = event.pageX || (event.touches ? event.touches[0].pageX : 0);
    const posY = event.pageY || (event.touches ? event.touches[0].pageY : 0);
    const normalized = {
      message_id: msg.message_id || msg.id,
      sender: msg.messages ? msg.messages.sender : msg.sender,
      message: msg.messages ? msg.messages.message : msg.message,
      image_url: msg.messages ? msg.messages.image_url : msg.image_url,
      read_status: msg.messages ? msg.messages.read_status : msg.read_status,
      is_edited: msg.messages ? msg.messages.is_edited : msg.is_edited,
    };
    setSelectedMessage(msg);
    setContextMenu({ visible: true, x: posX, y: posY, message: normalized });
  };

  // 10. Improved long-press detection for mobile.
  // Records the starting touch coordinate and fires the context menu if the touch remains nearly stationary.
  const startLongPress = (event, msg) => {
    if (isScrolling) return; // Do not trigger long press during scroll.
    const touch = event.touches ? event.touches[0] : null;
    if (!touch) return;
    touchStartPosition.current = { x: touch.pageX, y: touch.pageY };
    touchTimeout.current = setTimeout(() => {
      const syntheticEvent = {
        pageX: touch.pageX,
        pageY: touch.pageY,
        preventDefault: () => {},
      };
      handleContextMenu(syntheticEvent, msg);
    }, 600);
  };

  // Cancel long press when the touch moves too far.
  const moveLongPress = (event) => {
    if (!touchStartPosition.current.x && !touchStartPosition.current.y) return;
    const touch = event.touches ? event.touches[0] : null;
    if (!touch) return;
    const dx = Math.abs(touch.pageX - touchStartPosition.current.x);
    const dy = Math.abs(touch.pageY - touchStartPosition.current.y);
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  const cancelLongPress = () => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
    }
  };

  // 11. Handle editing.
  const handleEdit = () => {
    setEditingMessage(contextMenu.message);
    const currentText =
      contextMenu.message.message ||
      (contextMenu.message.messages && contextMenu.message.messages.message);
    setEditText(currentText);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // 12. Save an edited message.
  const handleSaveEdit = async () => {
    const formData = new FormData();
    formData.append('messageId', editingMessage.message_id || editingMessage.id);
    formData.append('sender_id', senderId);
    formData.append('newMessage', editText);
    if (editImage) formData.append('image', editImage);
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/edit`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const updatedMsg = { message_id: data.updatedMessage.id, ...data.updatedMessage };
        updatedMsg.is_edited = true;
        setMessages(prev =>
          prev.map(msg =>
            String(msg.message_id || msg.id) === String(editingMessage.message_id || editingMessage.id)
              ? updatedMsg
              : msg
          )
        );
        if (socketRef.current) {
          socketRef.current.emit('messageEdited', updatedMsg);
        }
        setEditingMessage(null);
        setEditText('');
        setEditImage(null);
        setSelectedMessage(null);
      } else {
        console.error('Failed to edit message:', data.message);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // 13. Handle deletion.
  const handleDelete = async () => {
    const messageId = contextMenu.message.message_id || contextMenu.message.id;
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(prev =>
          prev.filter(msg => String(msg.message_id || msg.id) !== String(messageId))
        );
        if (socketRef.current) {
          socketRef.current.emit('messageDeleted', { messageId });
        }
      } else {
        console.error('Failed to delete message:', data.message);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  // 14. Handle sharing a message.
  const handleShare = () => {
    const text =
      contextMenu.message.message ||
      (contextMenu.message.messages && contextMenu.message.messages.message);
    if (navigator.share) {
      navigator
        .share({
          title: 'Message',
          text,
          url: window.location.href,
        })
        .catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(text);
      alert('Message copied to clipboard');
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  // 15. Handle copying a message.
  const handleCopy = () => {
    const textToCopy =
      contextMenu.message.message ||
      (contextMenu.message.messages && contextMenu.message.messages.message);
    if (textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => console.log('Message copied to clipboard'))
        .catch(err => console.error('Failed to copy:', err));
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  // 16. Handle downloading an image.
  const handleDownload = async () => {
    const imageUrl =
      contextMenu.message.image_url ||
      (contextMenu.message.messages && contextMenu.message.messages.image_url);
    if (imageUrl) {
      try {
        const response = await wrapperFetch(imageUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'downloaded_image';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  return (
    <div className="order-messages">
      <div className="messages-header">
        <h2>Order #{orderId}</h2>
      </div>
      {/* Apply a blur background when a message is selected */}
      <div className={`messages-container-order ${selectedMessage ? 'blur' : ''}`}>
        {Object.keys(groupedMessages).map(date => (
          <div key={date} style={{ margin: 0 }}>
            <div className="date-divider">{date}</div>
            {groupedMessages[date].map(msg => {
              const actualSender = msg.messages ? msg.messages.sender : msg.sender;
              const messageContent = msg.messages ? msg.messages.message : msg.message;
              const imageUrl = msg.messages ? msg.messages.image_url : msg.image_url;
              const isRead = msg.messages ? msg.messages.read_status : msg.read_status;
              const isEdited = msg.messages ? msg.messages.is_edited : msg.is_edited;
              const id = msg.message_id || msg.id;
              const messageData = {
                message_id: id,
                sender: actualSender,
                message: messageContent,
                image_url: imageUrl,
                read_status: isRead,
                is_edited: isEdited,
              };
              return (
                <div
                  key={id}
                  className={`message-wrapper${String(actualSender) === String(senderId) ? ' sent' : ' received'}`}
                  onContextMenu={(e) => handleContextMenu(e, messageData)}
                  onTouchStart={(e) => startLongPress(e, messageData)}
                  onTouchMove={moveLongPress}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                >
                  <div className="message-container-order">
                    <div className={`message-bubble${String(actualSender) === String(senderId) ? ' sent' : ' received'}`}>
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="Message attachment"
                          className="message-image"
                          onContextMenu={(e) => handleContextMenu(e, messageData)}
                          onTouchStart={(e) => startLongPress(e, messageData)}
                          onTouchMove={moveLongPress}
                          onTouchEnd={cancelLongPress}
                          onTouchCancel={cancelLongPress}
                        />
                      )}
                      <p className="message-text-play">{messageContent}</p>
                    </div>
                    {String(actualSender) === String(senderId) ? (
                      <div className="md-read-status-container">
                        {isEdited && <span className="md-edited-indicator">(edited)</span>}
                        <span className="md-read-status">{isRead ? 'Read' : 'Delivered'}</span>
                      </div>
                    ) : (
                      isEdited && <div className="md-edited-indicator">(edited)</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="message-input">
        <input
          type="text"
          placeholder="Message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="input-field"
        />
        {imageFile && (
          <div className="image-preview">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" />
            <button onClick={removeImagePreview}>×</button>
          </div>
        )}
        <input type="file" onChange={handleFileUpload} id="file-upload" style={{ display: 'none' }} />
        <label htmlFor="file-upload" className="upload-label">
          📎
        </label>
        <button onClick={handleSendMessage} className="send-button">
          Send
        </button>
      </div>
      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} ref={contextRef}>
          {String(contextMenu.message.sender) === String(senderId) ? (
            <>
              <button onClick={handleEdit}>Edit</button>
              <button onClick={handleDelete}>Delete</button>
              <button onClick={handleCopy}>Copy</button>
              <button onClick={handleShare}>Share</button>
              {contextMenu.message.image_url && <button onClick={handleDownload}>Download</button>}
            </>
          ) : (
            <>
              <button onClick={handleCopy}>Copy</button>
              {contextMenu.message.image_url && (
                <>
                  <button onClick={handleShare}>Share</button>
                  <button onClick={handleDownload}>Download</button>
                </>
              )}
            </>
          )}
        </div>
      )}
      {editingMessage && (
        <div className="edit-modal">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit message..."
          ></textarea>
          <input type="file" onChange={(e) => setEditImage(e.target.files[0])} />
          <button onClick={handleSaveEdit}>Save</button>
          <button
            onClick={() => {
              setEditingMessage(null);
              setSelectedMessage(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderMessages;
