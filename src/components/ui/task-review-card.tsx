import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { TaskReview } from '@/mock/task-api';
import type { ChatMessage } from '@/mock/chat';
import {
  brandBlue,
  darkChat,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  spacing,
  sysColor,
} from '@/theme/theme';

/**
 * The coding task's REVIEW, in the thread (2026-07-28).
 *
 * Approvals resolve in the asking chat bubble — review screens are banned
 * (product rule), so a real git diff, the changed files, and the typecheck
 * all land here as a card and stamp in place once answered. Same grammar as
 * approval-card: quiet text reject on the left, filled pill on the right.
 *
 * Everything shown here was collected by the BRIDGE from real git output.
 * Nothing on this card is a claim the model made about its own work.
 */

/** the run console's own dark face — the diff is machine output, so it
 * wears the machine's surface, exactly like the >_ panel */
const CONSOLE_BG = '#0E1626';
const CONSOLE_INK = 'rgba(255,255,255,0.92)';
const CONSOLE_DIM = 'rgba(255,255,255,0.55)';

/** diff line colouring: additions ready-green, deletions fail-red, hunk
 * headers dim. One glance should read like a diff without a legend. */
function diffColor(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---')) return CONSOLE_DIM;
  if (line.startsWith('@@')) return brandBlue;
  if (line.startsWith('+')) return sysColor.ready;
  if (line.startsWith('-')) return sysColor.fail;
  return CONSOLE_DIM;
}

/** a long diff would swallow the thread — cap it and say so honestly */
const DIFF_LINE_CAP = 400;

export function TaskReviewCard({
  review,
  outcome,
  busy,
  onApprove,
  onReject,
}: {
  review: TaskReview;
  outcome?: ChatMessage['reviewOutcome'];
  /** an approve/reject request is in flight — buttons lock, no double-send */
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [diffOpen, setDiffOpen] = useState(false);

  const lines = review.diff ? review.diff.split('\n') : [];
  const shown = lines.slice(0, DIFF_LINE_CAP);
  const clipped = lines.length - shown.length;
  const passed = review.typecheckPassed;

  return (
    <View
      style={{
        marginTop: spacing.sm,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: darkChat.glassBorder,
        backgroundColor: darkChat.surface,
        overflow: 'hidden',
      }}>
      {/* header: what came back, and on which branch */}
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name="git-branch-outline" size={14} color={darkChat.textSecondary} />
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              letterSpacing: 0.3,
              color: darkChat.textSecondary,
            }}>
            {review.branch ?? 'task branch'}
          </Text>
          {review.baseRef ? (
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                color: darkChat.textTertiary,
              }}>
              {`from ${review.baseRef}`}
            </Text>
          ) : null}
        </View>

        <Text
          style={{
            marginTop: spacing.sm,
            fontSize: fontSize.body,
            lineHeight: 21,
            fontFamily: fontFamily.regular,
            color: darkChat.text,
          }}>
          {review.summary}
        </Text>
      </View>

      {/* RETRIEVAL: which version the worktree actually held. Matters because
          the worktree comes from origin/main and can lag the local checkout —
          the reviewer should see what was really patched. */}
      {review.retrievalLog?.length ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 10,
              letterSpacing: 0.3,
              color: darkChat.textTertiary,
              marginBottom: 6,
            }}>
            RETRIEVED FROM WORKTREE
          </Text>
          {review.retrievalLog.map((line, i) => (
            <Text
              key={i}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                lineHeight: 17,
                color: line.startsWith('note:') ? brandBlue : darkChat.textSecondary,
              }}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {/* changed files — from `git diff --name-only`, not from the model */}
      {review.changedFiles.length > 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 10,
              letterSpacing: 0.3,
              color: darkChat.textTertiary,
              marginBottom: 6,
            }}>
            {`${review.changedFiles.length} FILE${review.changedFiles.length === 1 ? '' : 'S'} CHANGED`}
          </Text>
          {review.changedFiles.map((f) => (
            <Text
              key={f}
              numberOfLines={1}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 12,
                lineHeight: 19,
                color: darkChat.text,
              }}>
              {f}
            </Text>
          ))}
        </View>
      ) : null}

      {/* the real diff, folded by default so the thread stays readable */}
      {lines.length > 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Pressable
            onPress={() => setDiffOpen((v) => !v)}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons
              name={diffOpen ? 'chevron-down' : 'chevron-forward'}
              size={12}
              color={darkChat.textSecondary}
            />
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                color: darkChat.textSecondary,
              }}>
              {diffOpen ? 'Hide diff' : 'View diff'}
            </Text>
          </Pressable>

          {diffOpen ? (
            <View
              style={{
                marginTop: spacing.sm,
                borderRadius: 12,
                backgroundColor: CONSOLE_BG,
                paddingVertical: spacing.sm,
              }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md }}>
                <View>
                  {shown.map((line, i) => (
                    <Text
                      key={i}
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 10,
                        lineHeight: 15,
                        color: diffColor(line),
                      }}>
                      {line.length ? line : ' '}
                    </Text>
                  ))}
                  {clipped > 0 ? (
                    <Text
                      style={{
                        marginTop: 6,
                        fontFamily: fontFamily.mono,
                        fontSize: 10,
                        color: CONSOLE_DIM,
                      }}>
                      {`… ${clipped} more lines`}
                    </Text>
                  ) : null}
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* TYPECHECK, not tests: this repo has no test suite, and calling tsc
          output "tests" would misrepresent what was actually verified */}
      {review.testOutput ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: passed === false ? sysColor.fail : sysColor.ready,
              }}
            />
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                letterSpacing: 0.3,
                color: darkChat.textTertiary,
              }}>
              {passed === false ? 'TYPECHECK FAILED' : 'TYPECHECK PASSED'}
            </Text>
          </View>
          <View
            style={{
              marginTop: 6,
              borderRadius: 12,
              backgroundColor: CONSOLE_BG,
              padding: spacing.md,
            }}>
            <Text
              numberOfLines={10}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                lineHeight: 15,
                color: passed === false ? sysColor.fail : CONSOLE_INK,
              }}>
              {review.testOutput}
            </Text>
          </View>
        </View>
      ) : null}

      {/* the answer row — or, once answered, the receipt that replaces it */}
      {outcome ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: darkChat.glassBorder,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}>
          {outcome.state === 'approved' ? (
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark" size={13} color={brandBlue} />
                <Text
                  style={{
                    fontSize: fontSize.small,
                    fontFamily: fontFamily.semibold,
                    color: brandBlue,
                  }}>
                  Pushed
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 11,
                  color: darkChat.textSecondary,
                }}>
                {`${outcome.branch} · ${outcome.commit.slice(0, 7)}`}
              </Text>
              {outcome.url ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    color: darkChat.textTertiary,
                  }}>
                  {outcome.url}
                </Text>
              ) : null}
            </View>
          ) : outcome.state === 'rejected' ? (
            <Text
              style={{
                fontSize: fontSize.small,
                fontFamily: fontFamily.regular,
                color: darkChat.textSecondary,
              }}>
              Discarded. The task branch and its worktree are gone.
            </Text>
          ) : (
            <Text
              style={{
                fontSize: fontSize.small,
                fontFamily: fontFamily.regular,
                color: sysColor.fail,
              }}>
              {outcome.error}
            </Text>
          )}
        </View>
      ) : (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: darkChat.glassBorder,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: spacing.lg,
          }}>
          <Pressable onPress={onReject} disabled={busy} hitSlop={8}>
            {({ pressed }) => (
              <Text
                style={{
                  color: darkChat.textSecondary,
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                  opacity: busy ? 0.4 : pressed ? 0.5 : 1,
                }}>
                Reject
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={onApprove}
            disabled={busy}
            hitSlop={8}
            style={({ pressed }) => ({
              backgroundColor: '#FFFFFF',
              borderRadius: radius.pill,
              paddingVertical: 7,
              paddingHorizontal: spacing.md,
              opacity: busy ? 0.4 : pressed ? 0.85 : 1,
            })}>
            <Text
              style={{
                color: '#16181C',
                fontSize: fontSize.small,
                fontFamily: fontFamily.semibold,
              }}>
              {busy ? 'Working…' : 'Approve'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default TaskReviewCard;
