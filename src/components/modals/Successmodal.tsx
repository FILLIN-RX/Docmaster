import { Modal } from "@mantine/core";
import { useI18n } from "../../context/I18nContext";

interface SuccessModalProps {
  refNumber: string;
  onClose: () => void;
  onNewDeclaration: () => void;
  onMyDeclarations: () => void;
}

export default function SuccessModal({
  refNumber,
  onClose,
  onNewDeclaration,
  onMyDeclarations,
}: SuccessModalProps) {
  const { t } = useI18n();

  return (
    <Modal opened onClose={onClose} size="sm" withCloseButton={false} padding="xl">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-check text-green-dark text-4xl" />
        </div>

        <h2 className="font-bricolage text-2xl font-black text-textMain mb-2 leading-tight">
          {t("success_declaration_title")}
        </h2>

        <p className="text-[13px] text-textMuted leading-relaxed mb-6">
          {t("success_declaration_desc")}
        </p>

        <div className="inline-block px-6 py-2.5 bg-bgMain border-2 border-borderMain rounded-xl mb-3">
          <p className="text-lg font-bricolage font-black text-green-dark tracking-[0.1em]">
            {refNumber}
          </p>
        </div>
        <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-8">
          {t("success_keep_reference")}
        </p>

        <button
          className="w-full mb-4 px-6 py-3.5 bg-primary text-white rounded-2xl font-bricolage font-black text-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-3 group"
        >
          <i className="fa-solid fa-file-arrow-down group-hover:translate-y-0.5 transition-transform" />
          {t("success_download_pdf")}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onNewDeclaration}
            className="px-4 py-3 bg-white border-2 border-borderMain text-textMain rounded-xl text-xs font-bold hover:bg-bgMain transition-all">
            {t("success_new_declaration")}
          </button>
          <button onClick={onMyDeclarations}
            className="px-4 py-3 bg-green-dark text-white rounded-xl text-xs font-bold hover:bg-green-mid transition-all">
            {t("success_my_declarations")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
