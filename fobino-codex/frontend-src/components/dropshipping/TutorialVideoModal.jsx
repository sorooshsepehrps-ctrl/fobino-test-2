
// import React from 'react';
// import { Modal } from 'antd';

// const TutorialVideoModal = ({ open, onClose, videoUrl, title, description }) => {
//   return (
//     <Modal
//       open={open}
//       onCancel={onClose}
//       footer={null}
//       width={920}
//       destroyOnClose
//       centered
//       title={title || 'آموزش دراپ‌شیپینگ'}
//     >
//       <div className="dropshipping-tutorial-modal">
//         {description ? <p className="dropshipping-tutorial-modal__description">{description}</p> : null}

//         <div className="dropshipping-tutorial-modal__frame-wrap">
//           {videoUrl ? (
//             <iframe
//               title="dropshipping-tutorial-video"
//               src={videoUrl}
//               width="100%"
//               height="460"
//               frameBorder="0"
//               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//               allowFullScreen
//             />
//           ) : (
//             <div className="dropshipping-tutorial-modal__empty">
//               لینک ویدئو هنوز تنظیم نشده است.
//             </div>
//           )}
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default TutorialVideoModal;






/* frontend/my-app/src/components/dropshipping/TutorialVideoModal.jsx */

import React from 'react';

const TutorialVideoModal = ({ open, onClose, videoUrl, title, description }) => {
  if (!open) return null;

  return (
    <>
      <style>{`
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .tutorial-modal {
          background: #fff;
          border-radius: 28px;
          width: 920px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
        }

        .tutorial-modal-header {
          padding: 20px 28px;
          border-bottom: 1px solid #eef2f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tutorial-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #102766;
          margin: 0;
        }

        .tutorial-modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #9ca3af;
          transition: color 0.2s;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .tutorial-modal-close:hover {
          color: #102766;
          background: #f3f4f6;
        }

        .tutorial-modal-body {
          padding: 24px 28px;
          overflow-y: auto;
          flex: 1;
        }

        .dropshipping-tutorial-modal__description {
          color: #5f6b7a;
          line-height: 2;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .dropshipping-tutorial-modal__frame-wrap {
          border-radius: 20px;
          overflow: hidden;
          background: #f7f9fc;
          border: 1px solid #ecf0f5;
        }

        .dropshipping-tutorial-modal__empty {
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 14px;
          background: #f9fafb;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .tutorial-modal-body {
            padding: 20px;
          }

          .tutorial-modal-header {
            padding: 16px 20px;
          }

          .tutorial-modal-title {
            font-size: 18px;
          }
        }
      `}</style>

      <div className="custom-modal-overlay" onClick={onClose}>
        <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
          <div className="tutorial-modal-header">
            <h2 className="tutorial-modal-title">{title || 'آموزش دراپ‌شیپینگ'}</h2>
            <button className="tutorial-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="tutorial-modal-body">
            {description ? <p className="dropshipping-tutorial-modal__description">{description}</p> : null}

            <div className="dropshipping-tutorial-modal__frame-wrap">
              {videoUrl ? (
                <iframe
                  title="dropshipping-tutorial-video"
                  src={videoUrl}
                  width="100%"
                  height="460"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              ) : (
                <div className="dropshipping-tutorial-modal__empty">
                  لینک ویدئو هنوز تنظیم نشده است.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorialVideoModal;