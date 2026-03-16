package com.ecommerce.rider.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val PrimaryColor = Color(0xFF6200EE)
private val PrimaryDarkColor = Color(0xFF3700B3)
private val PrimaryLightColor = Color(0xFFBB86FC)
private val AccentColor = Color(0xFF03DAC5)
private val ErrorColor = Color(0xFFB00020)
private val BackgroundColor = Color(0xFFFAFAFA)
private val SurfaceColor = Color(0xFFFFFFFF)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryColor,
    onPrimary = Color.White,
    primaryContainer = PrimaryLightColor,
    onPrimaryContainer = Color.Black,
    secondary = AccentColor,
    onSecondary = Color.Black,
    tertiary = Color(0xFF03DAC5),
    onTertiary = Color.Black,
    error = ErrorColor,
    onError = Color.White,
    background = BackgroundColor,
    onBackground = Color.Black,
    surface = SurfaceColor,
    onSurface = Color.Black
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryLightColor,
    onPrimary = Color.Black,
    primaryContainer = PrimaryDarkColor,
    onPrimaryContainer = Color.White,
    secondary = AccentColor,
    onSecondary = Color.Black,
    tertiary = Color(0xFF03DAC5),
    onTertiary = Color.Black,
    error = ErrorColor,
    onError = Color.Black,
    background = Color(0xFF121212),
    onBackground = Color.White,
    surface = Color(0xFF1E1E1E),
    onSurface = Color.White
)

@Composable
fun RiderAppTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = RiderAppTypography,
        content = content
    )
}
