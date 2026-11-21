"""Append selected CC0 Quaternius UAL1/UAL2 clips to our compatible character rigs.
Usage: python scripts/assets/add-actor-clips.py UAL1_Standard.glb UAL2_Standard.glb
"""
import json
import struct
import sys
from pathlib import Path

SETS = [
    'Crouch_Fwd_Loop Crouch_Idle_Loop Jump_Start Jump_Loop Jump_Land Punch_Cross Punch_Jab Pistol_Aim_Neutral Pistol_Shoot Idle_Torch_Loop Swim_Fwd_Loop Swim_Idle_Loop Driving_Loop Sitting_Idle_Loop Sitting_Talking_Loop',
    'ClimbUp_1m Walk_Carry_Loop Idle_FoldArms_Loop',
]

def read(path):
    data = Path(path).read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20+size]), bytearray(data[28+size:])

def align(data, fill=b'\0'):
    data.extend(fill * (-len(data) % 4))
    return data

for character in ('luzia', 'davi'):
    path = Path(f'public/models/{character}.glb')
    dst, binary = read(path)
    nodes = {node.get('name'): i for i, node in enumerate(dst['nodes'])}
    for source, required in zip(sys.argv[1:], SETS):
        src, original = read(source)
        view_map, accessor_map = {}, {}
        def accessor(index):
            if index in accessor_map:
                return accessor_map[index]
            value = dict(src['accessors'][index]); v = value['bufferView']
            if v not in view_map:
                view = dict(src['bufferViews'][v]); at = view.get('byteOffset', 0)
                align(binary); view['byteOffset'] = len(binary)
                binary.extend(original[at:at+view['byteLength']])
                view_map[v] = len(dst['bufferViews']); dst['bufferViews'].append(view)
            value['bufferView'] = view_map[v]; accessor_map[index] = len(dst['accessors'])
            dst['accessors'].append(value); return accessor_map[index]
        names = {a['name'] for a in dst['animations']}
        for a in src['animations']:
            if a['name'] in names or a['name'] not in required.split():
                continue
            channels, samplers = [], []
            for channel in a['channels']:
                target = channel['target']; name = src['nodes'][target['node']].get('name')
                # Only the skeletal rotations are shared; gameplay handles root motion.
                if name not in nodes or target['path'] != 'rotation':
                    continue
                sampler = dict(a['samplers'][channel['sampler']]); sampler['input'] = accessor(sampler['input']); sampler['output'] = accessor(sampler['output'])
                channels.append({'sampler': len(samplers), 'target': {'node': nodes[name], 'path': 'rotation'}}); samplers.append(sampler)
            if channels:
                dst['animations'].append({'name': a['name'], 'channels': channels, 'samplers': samplers})
    align(binary);dst['buffers'][0]['byteLength'] = len(binary)
    meta = align(bytearray(json.dumps(dst,separators=(',',':')).encode()), b' ')
    path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(meta)+len(binary))+struct.pack('<I4s',len(meta),b'JSON')+meta+struct.pack('<I4s',len(binary),b'BIN\x00')+binary)
