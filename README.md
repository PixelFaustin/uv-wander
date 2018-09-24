# uv-wander

# Note
This repo contains terrible code. This started out as a scratchpad for WebGL1->WebGL2 migration experiments but ended up producing some pretty neat pictures so I decided to publish it here.

# Method

1) Render to texture a normalized quad UV map
2) On each tick, sample a direction vector from a noise texture, set the current fragment UV equal to the old fragment UV at the current fragment UV added with the direction vector
3) Flip the framebuffers, bind the flipped framebuffer and use it as the UV map for the given image
4) Apply wide antialiasing to create a paint smudge effect

# Screenshots
Sampled from a picture of Earth

![ss1](https://i.imgur.com/V6Lipku.png)

Sampled from a HDR picture of a beach

![ss2](https://i.imgur.com/ssyaH2o.png)

Sampled from a fantasy picture of some sorts

![ss3](https://i.imgur.com/fzCf3TJ.png)
