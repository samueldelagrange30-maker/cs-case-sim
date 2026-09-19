import type { OpenedSkin, SkinItem } from '../types'

/** Hardcoded pool for first-visit bot auction listings. */
export const SEED_SKIN_TEMPLATES: {
  item: SkinItem
  caseId: string
  caseName: string
  crateType: OpenedSkin['crateType']
  isRareSpecial: boolean
  preferWear: boolean
}[] = [
  {
    caseId: "crate-4236",
    caseName: "Gamma Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-63aa6463689b",
      name: "PP-Bizon | Harvester",
      paint_index: "594",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1c_M2-eJtvKeqcAFiYwPxgtfJ9SjuMmRQguynLyd76dSqfZlUoA5dwFOBb5BGxxNDlP-Lg5QKM2IoUyyqv2ixL7ihr6vFCD_SgdFoAow",
      phase: null,
      rarity: {
        id: "rarity_rare_weapon",
        name: "Mil-Spec Grade",
        color: "#4b69ff",
      },
    },
  },
  {
    caseId: "crate-4598",
    caseName: "Prisma Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-ea691ab700a8",
      name: "Galil AR | Akoben",
      paint_index: "842",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0OG-V6NsLPmfMWabzuxzvt5lRi67gVMlt2_dzd6qcH2TOgN0CpIlE7Ve5hbukdW0MrixslPW2IgQzyv8jypI8G81tJzCUipD",
      phase: null,
      rarity: {
        id: "rarity_rare_weapon",
        name: "Mil-Spec Grade",
        color: "#4b69ff",
      },
    },
  },
  {
    caseId: "crate-4811",
    caseName: "Stockholm 2021 Dust II Souvenir Package",
    crateType: "Souvenir",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-dc1a0332945f",
      name: "Galil AR | Amber Fade",
      paint_index: "246",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0POvV6JsJPWsA2KEwOJ6ueJWQyC0nQlp52uGm9yodC3GZ1d0CMdyQeJctRDqmtayY-Kz71fW2IIUziz8intK6TErvbiZh4dEMQ",
      phase: null,
      rarity: {
        id: "rarity_rare_weapon",
        name: "Mil-Spec Grade",
        color: "#4b69ff",
      },
    },
  },
  {
    caseId: "crate-4061",
    caseName: "Chroma Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-75138a0c07b3",
      name: "Desert Eagle | Naga",
      paint_index: "397",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7uORbKFsJ_yWMWmRxu9JvOhuRz39zEx06jjWm4n8Ii6WPFQhA5YjE7MJskPrwdTuZb7htlHbg9oTzCn2hjQJsHhQd9ynBw",
      phase: null,
      rarity: {
        id: "rarity_mythical_weapon",
        name: "Restricted",
        color: "#8847ff",
      },
    },
  },
  {
    caseId: "crate-4598",
    caseName: "Prisma Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-640691d10403",
      name: "MP5-SD | Gauss",
      paint_index: "846",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePF-JM-SHXOCzuN3pOhqcCW6khUz_WzTzYmhJXuSaANzW8EkQ7JZ4BjsxtSzYezr5lbfidlEzC-vjnxK7ih1o7FVYPX5q0o",
      phase: null,
      rarity: {
        id: "rarity_mythical_weapon",
        name: "Restricted",
        color: "#8847ff",
      },
    },
  },
  {
    caseId: "crate-4006",
    caseName: "DreamHack 2013 Souvenir Package",
    crateType: "Souvenir",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-ec9d6cd13e48",
      name: "AWP | Pit Viper",
      paint_index: "251",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk_PyvY6F-K_mdMWuZxuZi_rQ_GS3mxRwk4jvTyNv6eC-RPQV1W5AlTOZb4xLtw9fuNriw51Hd3otbjXKp4cSTTIs",
      phase: null,
      rarity: {
        id: "rarity_mythical_weapon",
        name: "Restricted",
        color: "#8847ff",
      },
    },
  },
  {
    caseId: "crate-4669",
    caseName: "CS20 Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-97024f744394",
      name: "MP9 | Hydra",
      paint_index: "910",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_jdk4uL3V6x0JOKSMWuZxuZi_rQ9H363xU5_4GrWnIr8IHqfbwBxA5R2QuZZshm6kdO2Mum35Q3ajoJbjXKp1xQlWoY",
      phase: null,
      rarity: {
        id: "rarity_legendary_weapon",
        name: "Classified",
        color: "#d32ce6",
      },
    },
  },
  {
    caseId: "crate-4006",
    caseName: "DreamHack 2013 Souvenir Package",
    crateType: "Souvenir",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-4429b6507c58",
      name: "R8 Revolver | Amber Fade",
      paint_index: "523",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2vaZtrIfSWMWqV1e96vOhqcDu2gxIrpTiXpYPwJiPTcAIpDJckF-9cuhfqltDuZujgs1DZj4hDy338jnhM73xusOcKVaos-qPJz1aW9R0yRq8",
      phase: null,
      rarity: {
        id: "rarity_legendary_weapon",
        name: "Classified",
        color: "#d32ce6",
      },
    },
  },
  {
    caseId: "crate-4695",
    caseName: "Prisma 2 Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-45686ca4a063",
      name: "AK-47 | Phantom Disruptor",
      paint_index: "941",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlJfA6H-CbD2mEzuNJtOh6XTyjgRI1jDGMnYftb3qTbQMpCZVxF-8Ku0Xtw4XkYu2xtQSL3d5FxSz-3H5Ovy895epRA6E7uvqAsbzZtpo",
      phase: null,
      rarity: {
        id: "rarity_legendary_weapon",
        name: "Classified",
        color: "#d32ce6",
      },
    },
  },
  {
    caseId: "crate-4811",
    caseName: "Stockholm 2021 Dust II Souvenir Package",
    crateType: "Souvenir",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-58267df1cb9f",
      name: "AK-47 | Gold Arabesque",
      paint_index: "921",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSJ_-fCliR0-90tfJ4WiyMmRQguynLntmvICieOARzCpMhF-BYsRe-xoHvYu_g5lSNj4NDyy2viCwY6Hlu5_FCD_Q1jEqYuQ",
      phase: null,
      rarity: {
        id: "rarity_ancient_weapon",
        name: "Covert",
        color: "#eb4b4b",
      },
    },
  },
  {
    caseId: "crate-4403",
    caseName: "Spectrum 2 Case",
    crateType: "Case",
    isRareSpecial: true,
    preferWear: true,
    item: {
      id: "skin-fcaadd7c92cc",
      name: "\u2605 Bowie Knife | Marble Fade",
      paint_index: "413",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I-uC4YbJsLM-RAXCZxNF3vd5kTjuxmRgYtTyBn7D1KCzPKhgpXMdyTeBb5BPuktPvZOi2sgWM2d9HmSr-i3xAuidssO8HBKcsrvLXkUifZhxP_T8X",
      phase: null,
      rarity: {
        id: "rarity_ancient_weapon",
        name: "Covert",
        color: "#eb4b4b",
      },
    },
  },
  {
    caseId: "crate-4281",
    caseName: "Gamma 2 Case",
    crateType: "Case",
    isRareSpecial: false,
    preferWear: true,
    item: {
      id: "skin-0305a5aaa4eb",
      name: "FAMAS | Roll Cage",
      paint_index: "604",
      image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1c_M2oaalsM8-BD2uc2NF6ueZhW2exzUhz4WjWmNqpdy-UbwJxDJtxReEMtRGwloflP7m04wfXi94QyXj9kGoXuV3JhaXD",
      phase: null,
      rarity: {
        id: "rarity_ancient_weapon",
        name: "Covert",
        color: "#eb4b4b",
      },
    },
  },
]
