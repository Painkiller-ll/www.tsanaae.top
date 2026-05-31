'use client';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl?: string;
}

export default function QrCodeModal({ isOpen, onClose, qrCodeUrl }: QrCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl bg-card border border-border p-6 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-4">
          {/* 微信图标 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#07c160">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.42 6.42 0 0 1-.246-1.79c0-3.558 3.39-6.451 7.585-6.451.258 0 .507.022.76.042C16.706 4.882 13.075 2.188 8.691 2.188zm-2.87 4.401c.63 0 1.14.51 1.14 1.14s-.51 1.14-1.14 1.14-1.14-.51-1.14-1.14.51-1.14 1.14-1.14zm5.577 0c.63 0 1.14.51 1.14 1.14s-.51 1.14-1.14 1.14-1.14-.51-1.14-1.14.51-1.14 1.14-1.14z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-foreground">扫码添加站长微信</h3>

          {qrCodeUrl ? (
            <div className="w-48 h-48 rounded-xl overflow-hidden border border-border bg-white p-2">
              <img src={qrCodeUrl} alt="微信二维码" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-xl border border-dashed border-border flex items-center justify-center">
              <p className="text-sm text-muted-foreground">暂未设置二维码</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">打开微信扫一扫，添加站长好友</p>
        </div>
      </div>
    </div>
  );
}
