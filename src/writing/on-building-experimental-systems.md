---
title: "On Building Experimental Systems"
date: 2026-03-01
excerpt: "Reflections on the craft of designing and assembling experimental physics instrumentation."
tags_display: [physics, engineering, craft]
reading_time: 3
permalink: /writing/on-building-experimental-systems/
---

There is a particular kind of knowledge that lives in the hands of people who build experimental systems. It is not the knowledge of textbooks or derivations, though those matter. It is the knowledge of what works — which adhesive holds at 4 Kelvin, how tightly to torque an optical mount before the post starts to walk, when a vibration is structural and when it is acoustic.

This knowledge resists formalization. You cannot write down a complete procedure for aligning a confocal microscope to a single molecule. The written steps would be technically correct and practically useless. What matters is the learned feel for when the signal is close — the subtle shift in the photon count that tells you the beam waist is approaching the focal plane, the faint halo in the back-reflection that reveals a tilt of half a millidegree.

I think about this often because I spend most of my working hours building things. Not computing things, not deriving things, though I do both. The primary mode of my research is construction: assembling optical paths, wiring photon counters, writing control software, growing crystals, fabricating nanostructures. Each of these has its own grammar, its own failure modes, its own satisfactions.

The most useful principle I have found is this: build the simplest version first, and make it work before you make it better. This sounds obvious. It is not. The temptation in experimental physics is to design the final system from the start — to account for every degree of freedom, every edge case, every future measurement you might want to make. This approach reliably produces systems that do nothing at all, because the integration complexity overwhelms your ability to debug.

Instead, I try to build in layers. The first layer is crude: a few optics on a breadboard, a rough alignment, a detector at the end. The goal is to see signal — any signal. Once signal exists, you have a reference point. You can improve one component at a time and watch the effect propagate. You can measure rather than simulate.

This iterative approach has a cost. You sometimes build things you later tear down. You spend time on temporary solutions that never become permanent. But the alternative — spending months on a design that fails on first contact with reality — is worse. The intermediate states teach you things that no amount of planning can reveal.

There is also the question of when to stop. Every experimental system can be improved. The mirror could be cleaner, the electronics could be quieter, the software could be more robust. Knowing when the system is good enough for the measurement you need is itself a skill, and one that takes years to develop. The answer is usually sooner than you think.

What I value most about this kind of work is its honesty. The photon counter does not care about your reputation or your theoretical predictions. It counts photons. If your system is well-built, the counts are clean and the physics is clear. If it is not, no amount of analysis will save you. There is a clarity in that feedback loop that I find deeply satisfying.
