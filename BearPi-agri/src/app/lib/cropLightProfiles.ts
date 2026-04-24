export type CropLightProfile = {
  color: string;
  label: string;
  nightStart: string;
  nightEnd: string;
};

const DEFAULT_PROFILE: CropLightProfile = {
  color: "#fef3c7",
  label: "全光谱白光补光",
  nightStart: "18:00",
  nightEnd: "06:00",
};

export const CROP_LIGHT_PROFILES: Record<string, CropLightProfile> = {
  "番茄": { color: "#fecaca", label: "红蓝复合白光补光", nightStart: "18:00", nightEnd: "06:00" },
  "黄瓜": { color: "#dbeafe", label: "蓝白复合光补光", nightStart: "18:00", nightEnd: "06:00" },
  "草莓": { color: "#fee2e2", label: "红蓝复合白光补光", nightStart: "18:00", nightEnd: "06:00" },
  "辣椒": { color: "#fecaca", label: "红蓝复合白光补光", nightStart: "18:00", nightEnd: "06:00" },
  "生菜": { color: "#e0f2fe", label: "蓝白复合光补光", nightStart: "18:00", nightEnd: "06:00" },
  "茄子": { color: "#fee2e2", label: "红蓝复合白光补光", nightStart: "18:00", nightEnd: "06:00" },
};

export function getCropLightProfile(crop: string | null | undefined): CropLightProfile {
  if (!crop) return DEFAULT_PROFILE;
  return CROP_LIGHT_PROFILES[crop] ?? DEFAULT_PROFILE;
}
