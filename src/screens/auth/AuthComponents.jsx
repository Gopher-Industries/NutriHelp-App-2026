import { useEffect, useState } from "react";
import {
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

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import useAppTheme from "../../hooks/useAppTheme";

const nutriHelpLogo = require("../../../assets/nutrihelp-logo.png");
const googleLogo = require("../../../assets/google-logo.png");

/* -------------------------------------------------------
   ICONS
------------------------------------------------------- */

function EyeIcon({ crossed = false, color = "#6B7280", size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

function ChevronLeftIcon({ color = "#18233D", size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

  const backSize = 44;

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
            style={[styles.backButton, { width: backSize, height: backSize }]}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeftIcon color={colors.text} size={24} />
          </Pressable>
        ) : (
          <View
            style={[styles.backPlaceholder, { width: backSize, height: backSize }]}
          />
        )}

        <Image
          source={nutriHelpLogo}
          style={[styles.nutriLogo, { width: 112, height: 48 }]}
          resizeMode="contain"
          accessible={false}
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
  return <Card style={styles.card}>{children}</Card>;
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

  return (
    <Text style={[styles.label, { color, fontSize: 14 }]}>{children}</Text>
  );
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
          fontSize: 12,
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
  const inputHeight = 50;

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
            minHeight: inputHeight,
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
              fontSize: 14,
              minHeight: inputHeight,
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
            style={[styles.eyeButton, { width: 44, height: 44 }]}
            onPress={onTogglePassword}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
          >
            <EyeIcon
              crossed={passwordVisible}
              color={colors.textSecondary}
              size={22}
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
    <Button
      label={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={[
        styles.primaryButton,
        {
          backgroundColor: disabled ? colors.disabled : colors.primary,
          opacity: 1,
        },
      ]}
      textStyle={[
        styles.primaryButtonText,
        { color: disabled ? colors.textSecondary : colors.primaryText },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    />
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
          minHeight: 48,
          paddingVertical: 10,
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
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <LoadingSpinner size="small" color={colors.text} />
      ) : (
        <>
          <Image
            source={googleLogo}
            style={[styles.googleLogo, { width: 42, height: 42 }]}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.googleButtonText,
              {
                color: colors.text,
                fontSize: 14,
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
    <Pressable
      style={styles.linkWrapper}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
    >
      <Text
        style={[
          styles.linkText,
          {
            color: colors.primary,
            fontSize: 12,
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
    alignItems: "center",
    justifyContent: "center",
  },

  backPlaceholder: {},

  nutriLogo: {},

  body: {
    flex: 1,
  },

  card: {
    padding: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 0,
  },

  label: {
    marginBottom: 8,
    fontWeight: "500",
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputBox: {
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    paddingVertical: 8,
  },

  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    marginTop: 8,
    fontWeight: "500",
  },

  primaryButton: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
  },

  primaryButtonText: {
    fontWeight: "700",
  },

  googleButton: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  googleLogo: {
    marginRight: 4,
  },

  googleButtonText: {
    fontWeight: "600",
  },

  linkWrapper: {
    paddingVertical: 4,
    alignItems: "center",
  },

  linkText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
