import { useLocalSearchParams } from "expo-router";

import { AccessDetailScreen } from "@/screens/setting/access-detail-screen";

export default function SettingAccessDetail() {
  const { accessId, accessCode, accessName } = useLocalSearchParams<{
    accessId: string;
    accessCode: string;
    accessName: string;
  }>();

  return (
    <AccessDetailScreen
      accessId={Number(accessId)}
      accessCode={accessCode ?? ""}
      accessName={accessName ?? ""}
    />
  );
}
