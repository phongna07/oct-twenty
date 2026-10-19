export type FlowerKind = 'rose' | 'peony' | 'tulip' | 'daisy' | 'lily'
export const FLOWERS: { kind: FlowerKind; name: string; meaning: string; color: string; accent: string; position: [number, number, number]; tilt: number }[] = [
  { kind: 'rose', name: 'Hoa hồng', meaning: 'Một chút ngọt ngào', color: '#9c0719', accent: '#d41c2b', position: [-0.78, 0.15, 0.5], tilt: 0.28 },
  { kind: 'peony', name: 'Mẫu đơn', meaning: 'Một chút dịu dàng', color: '#f093b5', accent: '#ffe0e4', position: [0.22, 0.55, -0.1], tilt: -0.04 },
  { kind: 'tulip', name: 'Tulip', meaning: 'Một chút rạng rỡ', color: '#ee7a94', accent: '#ffe1d5', position: [1.01, 0.24, 0.1], tilt: -0.35 },
  { kind: 'daisy', name: 'Cúc họa mi', meaning: 'Một chút an nhiên', color: '#fff1de', accent: '#fffdfa', position: [-1.23, -0.26, 0.75], tilt: 0.43 },
  { kind: 'lily', name: 'Bách hợp', meaning: 'Và thật nhiều yêu thương', color: '#ffc4d4', accent: '#fff3ec', position: [0.67, -0.4, 0.85], tilt: -0.24 },
]
export const TIMING = { countdown: 3, flower: 4.4, wrap: 25, greeting: 28, end: 30 }
export const GREETING = 'Chúc mừng ngày phụ nữ Việt Nam 20/10'
