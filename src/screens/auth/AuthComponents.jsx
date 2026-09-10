import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";

import useAppTheme from "../../hooks/useAppTheme";

const nutriHelpLogo = require("../../../assets/nutrihelp-logo.png");
const googleLogo = require("../../../assets/google-logo.png");

/* -------------------------------------------------------
   ICONS
------------------------------------------------------- */

function EyeIcon({ crossed = false, color = "#6B7280" }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12C4.6 7.8 8 5.5 12 5.5C16 5.5 19.4 7.8 21.5 12C19.4 16.2 16 18.5 12 18.5C8 18.5 4.6 16.2 2.5 12Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle
        cx={12}
        cy={12}
        r={3.2}
        stroke={color}
        strokeWidth={1.8}
      />

      {crossed ? (
        <Line
          x1={4}
          y1={20}
          x2={20}
          y2={4}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

function ChevronLeftIcon({ color = "#18233D" }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* -------------------------------------------------------
   AUTH SCREEN
------------------------------------------------------- */

export function AuthScreen({ children, onBack }) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!onBack) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack();
        return true;
      }
    );

    return () => subscription.remove();
  }, [onBack]);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top + 12, 48),
          paddingBottom: Math.max(insets.bottom, 32),
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeftIcon color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <Image
          source={nutriHelpLogo}
          style={styles.nutriLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.body}>{children}</View>
    </View>
  );
}

/* -------------------------------------------------------
   AUTH CARD
------------------------------------------------------- */

export function AuthCard({ children }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      {children}
    </View>
  );
}

/* -------------------------------------------------------
   FIELD LABEL
------------------------------------------------------- */

export function FieldLabel({
  children,
  error = false,
  focused = false,
}) {
  const { colors } = useAppTheme();

  let color = colors.text;

  if (error) {
    color = colors.error;
  } else if (focused) {
    color = colors.primary;
  }

  return <Text style={[styles.label, { color }]}>{children}</Text>;
}

/* -------------------------------------------------------
   FIELD ERROR
------------------------------------------------------- */

export function FieldError({ message }) {
  const { colors } = useAppTheme();

  if (!message) {
    return null;
  }

  return (
    <Text
      style={[
        styles.errorText,
        {
          color: colors.error,
        },
      ]}
    >
      {message}
    </Text>
  );
}

/* -------------------------------------------------------
   AUTH INPUT
------------------------------------------------------- */

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  editable = true,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePassword,
}) {
  const [focused, setFocused] = useState(false);
  const { colors } = useAppTheme();

  const hasValue = Boolean(value && String(value).length > 0);

  let borderColor = colors.border;
  let borderWidth = 1;

  if (error) {
    borderColor = colors.error;
    borderWidth = 1.5;
  } else if (focused) {
    borderColor = colors.primary;
    borderWidth = 2;
  } else if (hasValue) {
    borderColor = colors.text;
    borderWidth = 1.2;
  }

  if (!editable) {
    borderColor = colors.border;
    borderWidth = 1;
  }

  return (
    <View style={styles.inputGroup}>
      <FieldLabel error={Boolean(error)} focused={focused}>
        {label}
      </FieldLabel>

      <View
        style={[
          styles.inputBox,
          {
            borderColor,
            borderWidth,
            backgroundColor: editable
              ? colors.inputBackground
              : colors.surfaceSecondary,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              color: editable ? colors.text : colors.disabled,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            editable ? colors.textSecondary : colors.disabled
          }
          secureTextEntry={secureTextEntry && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {showPasswordToggle ? (
          <Pressable
            style={styles.eyeButton}
            onPress={onTogglePassword}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <EyeIcon
              crossed={passwordVisible}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      <FieldError message={error} />
    </View>
  );
}

/* -------------------------------------------------------
   PRIMARY AUTH BUTTON
------------------------------------------------------- */

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.primaryButton,
        {
          backgroundColor: disabled
            ? colors.disabled
            : colors.primary,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{
        color: "rgba(255,255,255,0.25)",
        borderless: false,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Text
          style={[
            styles.primaryButtonText,
            {
              color: disabled
                ? colors.textSecondary
                : colors.primaryText,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------
   GOOGLE BUTTON
------------------------------------------------------- */

export function GoogleButton({
  onPress,
  loading = false,
  disabled = false,
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.googleButton,
        {
          borderColor: colors.border,
          backgroundColor: disabled
            ? colors.surfaceSecondary
            : colors.surface,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{
        color: "rgba(128,128,128,0.12)",
        borderless: false,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <Image
            source={googleLogo}
            style={styles.googleLogo}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.googleButtonText,
              {
                color: colors.text,
              },
            ]}
          >
            Sign in with Google
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------
   HELPER LINK
------------------------------------------------------- */

export function HelperLink({ title, onPress }) {
  const { colors } = useAppTheme();

  return (
    <Pressable style={styles.linkWrapper} onPress={onPress}>
      <Text
        style={[
          styles.linkText,
          {
            color: colors.primary,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------
   STATIC LAYOUT STYLES
------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  backPlaceholder: {
    width: 36,
    height: 36,
  },

  nutriLogo: {
    width: 112,
    height: 48,
  },

  body: {
    flex: 1,
  },

  card: {},

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputBox: {
    height: 50,
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
  },

  eyeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },

  primaryButton: {
    marginTop: 12,
    marginBottom: 8,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  googleButton: {
    marginTop: 12,
    marginBottom: 8,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  googleLogo: {
    width: 42,
    height: 42,
    marginRight: 4,
  },

  googleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  linkWrapper: {
    paddingVertical: 4,
    alignItems: "center",
  },

  linkText: {
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});