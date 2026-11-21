import { MathUtils } from 'three';

// One gaze command for the pair. Head rotation does the larger movement;
// the pupils only make the small correction or glance inside the eyelids.
export function followEyeGaze(gaze, dt, acting, drift=0){
  const x=MathUtils.clamp(acting?.eye??acting?.look??0,-1,1);
  const y=MathUtils.clamp(acting?.eyePitch??(acting?.pitch??0)*2,-1,1);
  const blend=1-Math.exp(-dt*17);
  gaze.x=MathUtils.lerp(gaze.x,MathUtils.clamp(x*.92+drift*.08,-1,1),blend);
  gaze.y=MathUtils.lerp(gaze.y,y,blend);
}

// The two eyes share a mirrored image, whose axes are also diagonal relative
// to the face. Project a face-space gaze into each half of that atlas.
export const eyeAtlasBasis={horizontal:[.82,.57],vertical:[.57,-.82]};
