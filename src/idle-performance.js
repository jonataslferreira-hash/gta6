const ease=x=>x*x*(3-2*x);
const envelope=(t,start,duration)=>{const u=(t-start)/duration;return u<=0||u>=1?0:ease(Math.min(1,u*3))*ease(Math.min(1,(1-u)*3));};

// Layer short, asymmetric gestures over the authored idle without restarting the rig.
export function idlePerformance(time,male=false){
  const cycle=Math.floor(time/23),t=time%23;
  const glance=envelope(t,3.2,3.5)*((cycle+(male?1:0))%2?-1:1);
  const weight=envelope(t,7.9,4.5)*((cycle%3===0)!==male?1:-1);
  const cuff=envelope(t,14.0,3.3);
  const exhale=envelope(t,19.7,2.3);
  return {yaw:glance*.39+weight*.10,tilt:glance*.055+cuff*.19-exhale*.11,lean:weight*.078,cuff,breath:Math.sin(time*2.02)*.013-exhale*.031};
}
