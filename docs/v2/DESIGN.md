---
version: alpha
name: Languago Atelier
description: A calm, editorial learning workstation for serious English study.
colors:
  ink: "#1D2323"
  ink-soft: "#58615F"
  canvas: "#F6F4EF"
  surface: "#FAF9F5"
  surface-muted: "#EEECE6"
  line: "#D7D4CC"
  primary: "#314B4A"
  primary-dark: "#243938"
  accent: "#A24F32"
  accent-dark: "#7F3926"
  focus: "#B65D38"
  success: "#28664D"
  danger: "#A33F3F"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(2.15rem, 4.2vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.025em"
  body:
    fontFamily: "DM Sans, Avenir Next, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "DM Sans, Avenir Next, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "11px 20px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
---

## Overview

Languago Atelier makes English study feel credible, focused, and adult. The product uses an
editorial learning surface: warm paper, ink, quiet borders, restrained copper actions, and
clear typographic hierarchy. The mascot remains a brand anchor for the landing page and empty
states, never a repeated sticker or navigation icon.

## Colors

Ink carries structure and reading contrast. Warm canvas and surface tones separate content
without artificial shadows. Copper is reserved for primary action, progress emphasis, and
focus-adjacent highlights. Teal is retained only as a dark structural color so existing
semantic classes continue to work during migration.

## Typography

Display headings use a serif fallback stack to make lessons and section titles feel editorial.
DM Sans handles controls, metadata, navigation, and long UI text. Headings are compact and
intentional; scale is not used as decoration.

## Layout

Public marketing pages use a left-aligned Decide/Learn composition. Student dashboards use a
Monitor/Operate composition: next action first, learning path second, utilities below. Desktop
content is capped at 1180px; mobile uses 18px gutters and a 44px minimum touch target.

## Components

Cards are flat, lightly bordered surfaces. Buttons use a 6px radius rather than pills. Navigation
is text-led and uppercase only for compact metadata labels. Hover never carries the only state;
focus, active, selected, error, and success states must remain visible without a pointer.

## Do's and Don'ts

- Do use one primary action per viewport and real progress data.
- Do preserve Turkish-first copy and existing routes.
- Do expose keyboard and touch alternatives for every learning interaction.
- Do honor `prefers-reduced-motion`.
- Don't use gradients, glassmorphism, emoji as navigation, fake metrics, or decorative card grids.
- Don't imply mastery from completion or inferred counts.
