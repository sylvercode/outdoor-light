# Foundry VTT Outdoor Light

Simplify the management of outdoor lights for maps that are partly outdoor and partly indoor.

## How to manage this without the module

When you have a map where you want no global light, disable global lighting in the scene settings. Then add lights to the outdoor areas of the map.

### Light tweaks

Depending on the desired visual effect, you will probably tweak some settings.

#### Light without illumination (A)

If you don't want to alter the colors of the map, set the illumination of those lights to 0. This removes color change but you won't get an attenuation effect on dark areas. Attenuation becomes visible when the scene darkness level is increased. If you want to tweak the darkness range activiation, if must be set in every outdoor light 


#### Use complete darkness (B)

If you prefer to have the attenuation effect on dark areas, set the scene to full darkness and create lights with no color and zero attenuation, using only dim and bright radius. You lose the ability to dynamically change the darkness level and to globally toggle lights.

### Doorways and windows (C)

Be careful where you place lights for doors and windows and their radius. Since lights have a point of origin, they produce angled light penetration which can reach too far in. Place lights coming from multiple angles (especially if lights may create darkness in your game) but avoid placing them too close to openings. Adding small-radius lights at the center of openings ensures a realistic transition between lit and dark areas, but this can be problematic with closed doors if placed on the wrong side.

## Where this module comes in

This module simplifies managing the above cases by adding quality-of-life features.

### Outdoor lights and walls

New configurations allow lights to be flagged as *outdoor* and walls to be flagged as *outdoor border*. No matter the light restrictions on an *outdoor border* wall, an *outdoor* light will not pass through it. This helps with case **C**.

Activate the tool to apply the outdoor flag to lights and walls created with other tools.

Note that only one radius is used based on the *outdoor light status* in scene settings (see below).

Also, the outdoor tool acts as a layer. Controls for lights related to outdoor walls are shown only when the tool is active; normal lights are shown when the tool is deactivated.

### Walls with light emission

A wall configuration option specifies that the wall emits light. A light is created and kept updated at the wall's center. If the wall is a door, the light is present only when the door is open. When the outdoor tool is active, new walls that have no light restriction or are doors will emit light. This helps with case **C**.

#### Emission radius

The dim and bright radius defined in the wall config have two modes.

##### Length ratio

A ratio of the wall length (with a default configurable in module settings) is used and updated accordingly.

##### Static

You can specify a static numeric value.

### Scene settings

An *outdoor light mode* is added to scene settings. Based on the chosen mode, Foundry scene settings are adjusted and newly created *outdoor* lights will have default settings matching that mode.

#### Manual global light

This mode simplifies the flow described in situation **A**.

- Scene settings
  - Global illumination is turned off.
- Outdoor light settings
  - Luminosity is set to 0.
  - The maximum darkness is set to the illumination threshold of the scene (and kept in sync when scene change).

#### Global darkness

This mode simplifies the flow described in situation **B**.

- Scene settings
  - Global illumination is turned off.
  - Darkness level is set to 1.
  - Darkness level lock is activated.
- Outdoor light settings
  - Attenuation is set to 0.

### Outdoor light status

When using global darkness, the darkness level is fixed. This configuration sets outdoor lights to bright, dim, or off states. Changing the status selects which radius (bright or dim) is used by outdoor lights and updates existing lights accordingly.

A wall-emission light in dim status will no longer produce a bright radius; its dim radius is set to the original bright radius.

When the scene mode is manual global light, the brightness and status settings have no visual or mechanical effect in Foundry. Radius are changed in case other modules rely on them.

## Extra / Side Quest

This next feature is related to lights but is an extra.

### Curtain

A door can be marked as a curtain. This changes the control icon to a curtain and adjusts the door restrictions so it behaves like a curtain: when open, movement, light and sight are not fully passthrough; when closed, movement, light and sight still block.

Use this tool to add a curtain flag to new walls.

## Dev container

A dev container configuration is provided at [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) ([see][5]).

Recommended: create a personal configuration with mounts to your Foundry installation and data folder for easier testing and debugging. Copy `.devcontainer/devcontainer.json` to `.devcontainer/personal/devcontainer.json` and follow the instructions in the comments. The personal folder and suggested mount points are ignored by git.

[5]: https://code.visualstudio.com/docs/devcontainers/containers
