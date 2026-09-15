import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Video, Shield } from 'lucide-react';

const TeleconsultRoom = ({ roomId, onClose, patientName }) => {
  const { t } = useTranslation();

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-100 rounded-2xl">
        <p className="text-slate-500">No room ID provided</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold">{t('teleconsult.roomTitle', 'Video Consultation')}</h2>
            <p className="text-xs text-slate-400">
              {patientName ? `${t('hospital.patient')}: ${patientName}` : `Room: ${roomId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center text-xs text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3 mr-1.5" />
            {t('teleconsult.encrypted', 'End-to-end encrypted')}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Jitsi iframe */}
      <div className="flex-1 bg-black">
        <iframe
          src={`https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRANDING=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
          title="Teleconsultation Room"
        />
      </div>
    </motion.div>
  );
};

export default TeleconsultRoom;
