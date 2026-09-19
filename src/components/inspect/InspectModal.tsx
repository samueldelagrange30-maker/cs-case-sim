import { useEffect, useMemo, useState } from 'react'
import type { OpenedSkin } from '../../types'
import { displayName, rarityColor } from '../../lib/odds'
import {
  canAcceptStickers,
  emptySlots,
  getStickers,
  isSticker,
  MAX_STICKER_SLOTS,
  occupiedSlots,
} from '../../lib/stickers'

interface Props {
  skin: OpenedSkin
  onClose: () => void
  /** Stickers available in inventory (for apply picker). */
  stickerInventory?: OpenedSkin[]
  /** Whether the user owns this skin (can apply/remove). */
  editable?: boolean
  onApplySticker?: (
    weaponUid: string,
    stickerUid: string,
    slot: number,
  ) => { ok: boolean; error?: string; weapon?: OpenedSkin }
  onRemoveSticker?: (
    weaponUid: string,
    slot: number,
  ) => { ok: boolean; error?: string; weapon?: OpenedSkin }
  /** Notify parent when weapon was updated so they can refresh inspect skin. */
  onSkinUpdated?: (skin: OpenedSkin) => void
}

/** Horizontal positions (%) for sticker slots overlaid on the weapon image. */
const SLOT_LEFT_PCT = [12, 28, 44, 60, 76]

export function InspectModal({
  skin: initialSkin,
  onClose,
  stickerInventory = [],
  editable = false,
  onApplySticker,
  onRemoveSticker,
  onSkinUpdated,
}: Props) {
  const [skin, setSkin] = useState(initialSkin)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedStickerUid, setSelectedStickerUid] = useState<string | null>(
    null,
  )
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    setSkin(initialSkin)
  }, [initialSkin])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerOpen) setPickerOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, pickerOpen])

  const color = rarityColor(skin)
  const stickers = getStickers(skin)
  const accepts = canAcceptStickers(skin)
  const availableStickers = useMemo(
    () => stickerInventory.filter(isSticker),
    [stickerInventory],
  )
  const freeSlots = emptySlots(skin)
  const used = occupiedSlots(skin)
  const canApply =
    editable && accepts && availableStickers.length > 0 && freeSlots.length > 0

  const showMsg = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 2800)
  }

  const confirmApply = () => {
    if (
      selectedStickerUid == null ||
      selectedSlot == null ||
      !onApplySticker
    ) {
      return
    }
    const res = onApplySticker(skin.uid, selectedStickerUid, selectedSlot)
    if (!res.ok) {
      showMsg(res.error ?? 'Application impossible.')
      return
    }
    if (res.weapon) {
      setSkin(res.weapon)
      onSkinUpdated?.(res.weapon)
    }
    setPickerOpen(false)
    setSelectedStickerUid(null)
    setSelectedSlot(null)
    showMsg('Sticker appliqué.')
  }

  const handleRemove = (slot: number) => {
    if (!editable || !onRemoveSticker) return
    if (!confirm('Retirer ce sticker ? (il sera perdu)')) {
      return
    }
    const res = onRemoveSticker(skin.uid, slot)
    if (!res.ok) {
      showMsg(res.error ?? 'Retrait impossible.')
      return
    }
    if (res.weapon) {
      setSkin(res.weapon)
      onSkinUpdated?.(res.weapon)
    }
    showMsg('Sticker retiré.')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Inspection"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-[#0a0d12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-[#0a0d12]/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted">
              Inspection
            </p>
            <h2 className="text-sm sm:text-base font-bold truncate">
              {displayName(skin)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            Fermer
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-4">
          <div
            className="relative rounded-xl border overflow-hidden bg-[#07090d]"
            style={{ borderColor: `${color}66` }}
          >
            <div className="relative flex items-center justify-center min-h-[min(48vh,380px)] p-6 sm:p-10">
              <img
                src={skin.item.image}
                alt={skin.item.name}
                className="max-h-[min(42vh,340px)] max-w-full object-contain drop-shadow-lg"
              />
              {/* Stickers overlaid on the weapon image (slot positions) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-[8%] h-14 sm:h-16">
                {Array.from({ length: MAX_STICKER_SLOTS }, (_, slot) => {
                  const st = stickers.find((s) => s.slot === slot)
                  if (!st) return null
                  return (
                    <img
                      key={`${st.uid}-${slot}`}
                      src={st.item.image}
                      alt={st.item.name}
                      title={st.item.name}
                      className="absolute h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] -translate-x-1/2"
                      style={{ left: `${SLOT_LEFT_PCT[slot]}%`, bottom: 0 }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-start justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color }}>
                {skin.isRareSpecial ? '★ Rare Special' : skin.item.rarity.name}
                {skin.isStatTrak ? ' · StatTrak™' : ''}
              </p>
              <p className="text-sm text-muted font-mono">
                {skin.hasWear && skin.float != null
                  ? `${skin.wearLabel} (${skin.wear}) · float ${skin.float.toFixed(6)}`
                  : 'Usure / float : N/A'}
              </p>
              <p className="text-[11px] text-muted">Depuis {skin.caseName}</p>
            </div>
            {canApply && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSlot(freeSlots[0] ?? 0)
                  setSelectedStickerUid(availableStickers[0]?.uid ?? null)
                  setPickerOpen(true)
                }}
                className="rounded-lg bg-accent/90 text-bg font-semibold px-4 py-2 text-sm hover:bg-accent"
              >
                Appliquer un sticker
              </button>
            )}
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              Stickers ({stickers.length}/{MAX_STICKER_SLOTS})
            </h3>
            <ul className="grid grid-cols-5 gap-2">
              {Array.from({ length: MAX_STICKER_SLOTS }, (_, slot) => {
                const st = stickers.find((s) => s.slot === slot)
                return (
                  <li
                    key={slot}
                    className="rounded-lg border border-border bg-panel-2 p-2 flex flex-col items-center gap-1 min-h-[88px]"
                  >
                    <span className="text-[10px] text-muted">
                      Slot {slot + 1}
                    </span>
                    {st ? (
                      <>
                        <img
                          src={st.item.image}
                          alt={st.item.name}
                          className="h-10 w-10 object-contain"
                        />
                        <p className="text-[9px] text-center line-clamp-2 text-muted leading-tight">
                          {st.item.name.replace(/^Sticker \|\s*/i, '')}
                        </p>
                        {editable && (
                          <button
                            type="button"
                            onClick={() => handleRemove(slot)}
                            className="text-[10px] text-covert hover:underline"
                          >
                            Retirer
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-muted/60 mt-3">
                        Vide
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        {flash && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-accent/40 bg-panel px-3 py-1.5 text-xs shadow-lg">
            {flash}
          </div>
        )}
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-3"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-panel p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold">Appliquer un sticker</h3>
            <p className="text-xs text-muted">
              Choisissez un sticker de l&apos;inventaire et un emplacement libre
              (1–{MAX_STICKER_SLOTS}).
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {availableStickers.map((st) => (
                <button
                  key={st.uid}
                  type="button"
                  onClick={() => setSelectedStickerUid(st.uid)}
                  className={`w-full flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                    selectedStickerUid === st.uid
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <img
                    src={st.item.image}
                    alt=""
                    className="h-8 w-8 object-contain"
                  />
                  <span className="line-clamp-2">{st.item.name}</span>
                </button>
              ))}
              {availableStickers.length === 0 && (
                <p className="text-xs text-muted">Aucun sticker en inventaire.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: MAX_STICKER_SLOTS }, (_, slot) => {
                const filled = used.has(slot)
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={filled}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold border disabled:opacity-35 ${
                      selectedSlot === slot
                        ? 'border-accent bg-accent/20 text-accent'
                        : 'border-border'
                    }`}
                  >
                    {slot + 1}
                    {filled ? ' ✓' : ''}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={selectedStickerUid == null || selectedSlot == null}
                onClick={confirmApply}
                className="flex-1 rounded-lg bg-accent/90 text-bg font-semibold py-2 text-sm disabled:opacity-40"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
