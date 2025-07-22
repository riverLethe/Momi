import React, { useState, useCallback, useMemo } from "react";
import { Alert, TouchableOpacity } from "react-native";
import {
  Text,
  YStack,
  XStack,
  Card,
  Avatar,
  useTheme,
  Separator,
  Circle,
} from "tamagui";
import { Crown, ShieldUserIcon, Users } from "lucide-react-native";
import { useFamilyActions } from "./useFamilyActions";
import { FamilySpace, FamilyMember } from "@/types/family.types";
import { useAuth } from "@/providers/AuthProvider";
import { SwipeableRow } from "../ui/SwipeableRow";
import { useTranslation } from "react-i18next";

interface FamilyMembersListProps {
  familySpace: FamilySpace;
  onFamilyUpdated: (updatedSpace: FamilySpace) => void;
}

interface FamilyMemberItemProps {
  member: FamilyMember;
  familySpace: FamilySpace;
  onRemove: (memberId: string, memberName: string) => void;
  isCreator: boolean;
  currentUserId?: string;
  isRemovingMember: boolean;
  /** Whether the swipeable row is currently open */
  isOpen?: boolean;
  /** Callback when the row has been opened */
  onSwipeOpen?: () => void;
  /** Callback when the row has been closed */
  onSwipeClose?: () => void;
  /** Callback when swipe gesture starts */
  onSwipeStart?: () => void;
}

const FamilyMemberItem: React.FC<FamilyMemberItemProps> = ({
  member,
  familySpace,
  onRemove,
  isCreator,
  currentUserId,
  isRemovingMember,
  isOpen = false,
  onSwipeOpen,
  onSwipeClose,
  onSwipeStart,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const isCurrentUser = member.userId === currentUserId;
  const isMemberCreator =
    member.isCreator || member.userId === familySpace.createdBy;

  // 只有家庭创建者可以移除成员，但不能移除自己（家庭创建者）
  // 也不能移除其他创建者（如果有多个创建者的话）
  const canRemove = isCreator && !isCurrentUser && !isMemberCreator;

  // 缓存格式化的最后交易时间
  const formattedLastTransaction = useMemo(() => {
    if (!member.lastTransactionTime) return null;
    return new Date(member.lastTransactionTime).toLocaleDateString("en-US");
  }, [member.lastTransactionTime]);

  const handleDelete = useCallback(() => {
    onRemove(member.id, member.name || "Unknown User");
  }, [onRemove, member.id, member.name]);

  const handlePress = useCallback(() => {
    // 点击时关闭滑动状态
    onSwipeClose?.();
    // 这里可以添加点击成员的逻辑，比如查看成员详情
  }, [onSwipeClose]);

  return (
    <SwipeableRow
      disabled={!canRemove || isRemovingMember}
      onDelete={canRemove ? handleDelete : undefined}
      isOpen={isOpen}
      onSwipeOpen={onSwipeOpen}
      onSwipeClose={onSwipeClose}
      onSwipeStart={onSwipeStart}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={isRemovingMember}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          opacity: isRemovingMember ? 0.4 : 1,
        }}
      >
        <XStack alignItems="center" justifyContent="space-between" width="100%">
          <XStack alignItems="center" gap="$3" flex={1}>
            {/* <Circle borderRadius="$4" size="$4" backgroundColor="$blue5">
              <Text fontSize="$3" fontWeight="$6" color="$blue11">
                {member?.name?.substring(0, 2).toUpperCase() || 'U'}
              </Text>
            </Circle> */}

            <YStack flex={1}>
              <XStack alignItems="center" gap="$2">
                {isMemberCreator && (
                  <ShieldUserIcon size={24} color={theme.blue9?.get()} />
                )}
                <Text
                  color="$color"
                  fontSize="$3"
                  fontWeight="500"
                  numberOfLines={1}
                  lineHeight={22}
                >
                  {member.name || "Unknown User"}
                </Text>
                {isCurrentUser && (
                  <Text color="$blue9" fontSize="$3" fontWeight="$5">
                    ({t("You")})
                  </Text>
                )}
              </XStack>

              {formattedLastTransaction && (
                <Text
                  color="$color9"
                  fontSize="$2"
                  numberOfLines={1}
                  lineHeight={16}
                >
                  {t("Last transaction")}: {formattedLastTransaction}
                </Text>
              )}
            </YStack>
          </XStack>
        </XStack>
      </TouchableOpacity>
    </SwipeableRow>
  );
};

export default function FamilyMembersList({
  familySpace,
  onFamilyUpdated,
}: FamilyMembersListProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();
  const { removeMember, isRemovingMember } = useFamilyActions();

  /** Track global open member id for swipe actions */
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  const isCreator = familySpace.createdBy === user?.id;
  const members = familySpace.members || [];

  const handleRemoveMember = useCallback(
    async (memberId: string, memberName: string) => {
      Alert.alert(
        t("Remove Member"),
        t("Are you sure you want to remove {{name}} from the family?", {
          name: memberName,
        }),
        [
          { text: t("Cancel"), style: "cancel" },
          {
            text: t("Remove"),
            style: "destructive",
            onPress: async () => {
              const result = await removeMember(familySpace, memberId);
              if (result) {
                onFamilyUpdated(result);
              }
            },
          },
        ]
      );
    },
    [removeMember, familySpace, onFamilyUpdated, t]
  );

  return (
    <YStack gap="$3">
      {/* Members List */}
      {members.length > 0 ? (
        <Card
          overflow="hidden"
          elevation={0.5}
          backgroundColor="$card"
        >
          <Card.Header
            borderBottomWidth={1}
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            borderBottomColor="$gray3"
            paddingHorizontal="$3"
            paddingVertical="$3"
          >
            <Text fontWeight="bold">{t("Member List")}</Text>
          </Card.Header>
          <YStack>
            {members.map((member, index) => (
              <React.Fragment key={member.id}>
                <FamilyMemberItem
                  member={member}
                  familySpace={familySpace}
                  onRemove={handleRemoveMember}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  isRemovingMember={isRemovingMember}
                  isOpen={openMemberId === member.id}
                  onSwipeOpen={() => setOpenMemberId(member.id)}
                  onSwipeClose={() => {
                    // Only clear if it was this member that closed
                    setOpenMemberId((prev) =>
                      prev === member.id ? null : prev
                    );
                  }}
                  onSwipeStart={() => {
                    // If another row is open, close it before opening this one
                    setOpenMemberId((prev) =>
                      prev && prev !== member.id ? null : prev
                    );
                  }}
                />
                {index < members.length - 1 && (
                  <Separator marginVertical="$0" borderColor="$borderColor" />
                )}
              </React.Fragment>
            ))}
          </YStack>
        </Card>
      ) : (
        /* Empty State */
        <YStack alignItems="center" gap="$2" paddingVertical="$4" marginTop="$4">
          <Users size={32} color={theme.gray8?.get()} />
          <Text color="$color10" fontSize="$3" textAlign="center">
            {t("No family members yet")}
          </Text>
          <Text color="$color10" fontSize="$2" textAlign="center">
            {t("Share your invite code to add members")}
          </Text>
        </YStack>
      )}
    </YStack>
  );
}
