---
name: pexels-images
description: Verified Pexels photo IDs by category plus the image URL format. Load when you need to embed real-looking imagery in a design.
---

# Pexels Images

Verified image IDs you can safely embed in generated UIs. **Never invent or guess IDs outside this list** — broken images ruin the design. If none of the categories fit, fall back to a `picsum.photos` placeholder instead.

## URL format

```
https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w={width}
```

- `w=800` for hero/banner images
- `w=400` for cards/thumbnails
- Always include meaningful `alt` text on the `<img>` tag.

## Categories

**Nature / Environment**
1108099, 414612, 1402787, 3225517, 2559941, 1179229, 3408744, 1172064, 1287145, 3571551

**People / Community**
3184418, 3184396, 3280130, 3184291, 1595385, 3810832, 3861969, 3182812, 3184360, 7551442

**Cities / Buildings**
466685, 1105766, 2507010, 169647, 3075993, 1519088, 2614818, 1388030, 2356045, 3586966

**Animals**
45201, 247502, 1108099, 567540, 1661179, 2295744, 1000445, 751689, 1366630, 162203

**Food / Health**
1640777, 1099680, 1092730, 376464, 1435904, 616401, 1092730, 357573, 461198, 704569

**Technology**
546819, 1181467, 3861969, 577585, 3183150, 1181244, 2007647, 3861958, 442150, 699122

## Fallback placeholder

For themes not covered above, use `picsum.photos` as a last resort:

```
https://picsum.photos/{width}/{height}
```

Or seeded for stable results across reloads:

```
https://picsum.photos/seed/{seed}/{width}/{height}
```
