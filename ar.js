// Parts that can be placed in the room with AR (files in ar/: <key>.glb for Android & web, <key>.usdz for iPhone).
// Made by tools/ar-models.mjs + tools/ar-usdz.mjs from Objaverse copies of these Sketchfab models (listed in tools/ar-sources.json).
const AR_MODELS = {
 "brain": {
  "name": "Human brain, Cerebrum & Brainstem",
  "by": "FrankJohansson",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/0aa0e33c5c854d1bab7bac9e1c7acaec"
 },
 "spinal-cord": {
  "name": "Cauda Equina - 4-22",
  "by": "aandp",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/5d39455bf3c040a6ba3ab030b7b46890"
 },
 "nerves": {
  "name": "Neuron",
  "by": "Bapichu",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/22fa9afe14724d9bbcffcc1160d6c447"
 },
 "eyes": {
  "name": "Eyeball - Photorealistic",
  "by": "TrentPierce",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/5c4565daf20e488fad8e0e4335c5c60a"
 },
 "ears": {
  "name": "Human Ear Model",
  "by": "ssavish274",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/e1f0f4b6fae54d59bdc3c6b2534eb411"
 },
 "nose": {
  "name": "Nose",
  "by": "Vikrama Raghuraman",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/fd594e7ee73a4aed90a35d79501dc6b4"
 },
 "teeth": {
  "name": "Mandibular Second Molar",
  "by": "University of Dundee, School of Dentistry",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/b77dcbc5052e4740b87cdb1964649742"
 },
 "mouth": {
  "name": "Human teeth",
  "by": "Alexander Antipov",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/c4c569f0e08948e2a572007a7a5726f2"
 },
 "hair-nails": {
  "name": "Hair and Beard Follicle 3D",
  "by": "yagmurmedya",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/fb3e6d87c9f5465c8bd82a2313fb9e93"
 },
 "skeleton": {
  "name": "Skeleton",
  "by": "Diego Luján García",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/4de7b96a351a4a35b1b6e5415277ff07"
 },
 "skull": {
  "name": "Human Male Skull",
  "by": "Ruslan Gadzhiev",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/f1eaaef50e5845c796d6834fd1b702e5"
 },
 "spine": {
  "name": "The human spinal column",
  "by": "3D",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/bcd9eee09ce044ef98a69c315aa792e2"
 },
 "ribs": {
  "name": "Human Thorax",
  "by": "Medulla",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/4aba9b2ced344bdf8f09656c6a298b50"
 },
 "arm-bones": {
  "name": "humerus, radius, & ulna",
  "by": "hreagers",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/f39e683a0af342b9801adedebf2b2a9a"
 },
 "hand": {
  "name": "Hand",
  "by": "Team Skeleton Wars",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/efd1df50e4a2457d91045a1727db7679"
 },
 "leg-bones": {
  "name": "Human femur bone",
  "by": "Tom O'Graphyx",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/0647ff9a00924f40a06e08361cea176c"
 },
 "foot": {
  "name": "Foot",
  "by": "Team Skeleton Wars",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/4c79b247004348548fe05587feac7f83"
 },
 "joints": {
  "name": "Articulated Knee",
  "by": "IslandMedicalProgramAnatomy",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/d8ac916a4d2149829e128a47a7cc9cb5"
 },
 "heart": {
  "name": "Human heart",
  "by": "Freddan755",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/3342c8c438904ee2b3b6b68fedf30531"
 },
 "blood": {
  "name": "Red Blood Cells",
  "by": "AK",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/c3f0295dca6244e286a0b21999c2d0ce"
 },
 "voice-box": {
  "name": "Anatomy of the Larynx",
  "by": "University of Dundee School of Medicine",
  "license": "CC Attribution-ShareAlike",
  "url": "https://sketchfab.com/3d-models/a00bc73a303c46248db6a13a88b23404"
 },
 "lungs": {
  "name": "Respiratory System",
  "by": "Vikrama Raghuraman",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/a7ac43a140644662a9b896b8a8a10f57"
 },
 "diaphragm": {
  "name": "Human Diaphragm",
  "by": "Devden",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/b62b76467c6948fbb735c78c0c428d65"
 },
 "food-pipe": {
  "name": "Human Digestive Organ",
  "by": "mr_izal",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/0e45d8761e384ca8953c1b6b4294d443"
 },
 "stomach": {
  "name": "Stomach",
  "by": "Vikrama Raghuraman",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/f4ccc8dd0f124d2d9f1d8d4db676e217"
 },
 "liver": {
  "name": "Human liver and gallbladder",
  "by": "ElliotSS",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/6c4e9bd0d49f4828b804259330c0c6c4"
 },
 "gallbladder": {
  "name": "Human liver and gallbladder",
  "by": "ElliotSS",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/6c4e9bd0d49f4828b804259330c0c6c4"
 },
 "pancreas": {
  "name": "Anatomi Pankreas",
  "by": "Erva Elli Kristanti",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/216b1b22b3284e5fbde85721e029e4ab"
 },
 "small-intestine": {
  "name": "Small and large intestine",
  "by": "antonia.sundberg",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/8a1ca8e3ca224cdeb9264674416bde38"
 },
 "large-intestine": {
  "name": "Colon",
  "by": "iqcenter",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/a8fef0b528104d5db20e703f7149cb5b"
 },
 "appendix": {
  "name": "Appendix",
  "by": "jkane326",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/94bba75bfd444c30ad6fac9d42887b6b"
 },
 "kidneys": {
  "name": "Kidney",
  "by": "cgmac",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/686992c2a7fb456eaa8997b0366f4062"
 },
 "bladder": {
  "name": "泌尿系統",
  "by": "10930903MandyHo",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/3780929cbff345fc901aa50e4fe58a27"
 },
 "pituitary": {
  "name": "Limbic System - AP Psychology",
  "by": "shojig",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/042b7c37263f4309bc8b4e18dc989102"
 },
 "thyroid": {
  "name": "Thyroid",
  "by": "ShapeShiftingBlob",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/b7e522c4f5dc4cea97d04a3d6773e96f"
 },
 "adrenal": {
  "name": "Urinary System Final",
  "by": "Hannah Koffman",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/4258252eb7c04e748ab7501eb5f1abb1"
 },
 "bone-marrow": {
  "name": "Long Bone",
  "by": "iqcenter",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/900a320bdc6244bd8f6b761441031ae9"
 },
 "white-cells": {
  "name": "Basophil",
  "by": "Vikrama Raghuraman",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/1f785fd1586f493196c38d048f0af0d6"
 },
 "cells": {
  "name": "Human Cell",
  "by": "markdragan",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/60ef7d2515b0403986ff9e8b7f234a66"
 },
 "dna": {
  "name": "DNA Ribbon Molecular Model",
  "by": "S.Duce",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/e3f82ab0c50a490bbace8d5ccc4698b8"
 },
 "womb": {
  "name": "Human Uterus",
  "by": "Stephaniie",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/102c3045cef84012a7b2e0c07a1eea8e"
 },
 "body": {
  "name": "Male Human Skeleton - ZBrush - Anatomy Study",
  "by": "Ruslan Gadzhiev",
  "license": "CC Attribution",
  "url": "https://sketchfab.com/3d-models/665890c542be433fb18ef235cf987cef"
 }
};
