import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';

import { CrewPixel } from '@/components/ui/crew-pixel';
import { darkChat, fontFamily, fontSize, spacing } from '@/theme/theme';

/**
 * The supporting work behind a reply, folded (2026-07-29).
 *
 * A multi-crew run used to give every member an equal message, each one
 * announcing itself by name ("Research here.", "Scribe here.") — three
 * voices for one answer. Now the crew member who OWNS the request speaks
 * plainly at the top, and everyone else's contribution lives in here:
 * closed by default, opened when you want the detail.
 *
 * Inside, nobody says their own name. Their FACE says it, which is what the
 * pixel crew is for.
 */

export type CrewNote = {
  /** crew-pixel character id: scout · quill · pilot · muppet */
  agentId: string;
  /** display name, used only for the accessibility label */
  name: string;
  /** what they contributed, in their own voice — no "X here." preamble */
  text: string;
};

export function CrewDetail({ notes, label }: { notes: CrewNote[]; label?: string }) {
  const [open, setOpen] = useState(false);
  if (notes.length === 0) return null;

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setOpen((v) => !v);
  };

  return (
    <View style={{ marginTop: spacing.sm }}>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          open ? 'Hide the rest of the crew' : `Show what ${notes.length} others did`
        }
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          opacity: pressed ? 0.6 : 1,
        })}>
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={12}
          color={darkChat.textSecondary}
        />
        {/* the faces preview WHO is inside, so the row is informative
            while still closed */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {notes.map((n, i) => (
            <View
              key={n.agentId}
              style={{
                width: 17,
                height: 17,
                borderRadius: 999,
                backgroundColor: '#F5F6F4',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(22,24,28,0.1)',
                // slight overlap: a crew stack, not a list
                marginLeft: i === 0 ? 0 : -5,
              }}>
              <CrewPixel id={n.agentId} size={12} />
            </View>
          ))}
        </View>
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            color: darkChat.textSecondary,
          }}>
          {open ? 'Hide the rest' : label ?? `${notes.length} more from the crew`}
        </Text>
      </Pressable>

      {open ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.md }}>
          {notes.map((n) => (
            <View
              key={n.agentId}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              {/* the face IS the attribution — no "Scribe here." needed */}
              <View
                style={{
                  width: 21,
                  height: 21,
                  borderRadius: 999,
                  backgroundColor: '#F5F6F4',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(22,24,28,0.1)',
                  marginTop: 1,
                }}>
                <CrewPixel id={n.agentId} size={15} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: fontSize.small,
                  lineHeight: 20,
                  fontFamily: fontFamily.regular,
                  color: darkChat.textSecondary,
                }}>
                {n.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default CrewDetail;
