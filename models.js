// Real 3D models from Sketchfab, each one checked by hand to be right for children.
// Pick again with tools/find3d.py (contact sheets in .work/sheets) — never add a model unseen.
const MODELS = {
 "brain": {
  "uid": "0aa0e33c5c854d1bab7bac9e1c7acaec",
  "name": "Human brain, Cerebrum & Brainstem",
  "by": "FrankJohansson",
  "license": "CC Attribution"
 },
 "spinal-cord": {
  "uid": "2e6be1399756494b9f185ce8c5900911",
  "name": "The Nervous System",
  "by": "University of Dundee, CAHID",
  "license": null
 },
 "nerves": {
  "uid": "05984ac2e2d1459fb9e3a0fab47ccb8e",
  "name": "Nerve Cell Anatomy In Details",
  "by": "ZMS1992",
  "license": "Editorial"
 },
 "eyes": {
  "uid": "225b58ebf0c84d6a9e2bc1e17cfbb167",
  "name": "Human Eye Photorealistic",
  "by": "Cesar Salcedo CG",
  "license": "Standard"
 },
 "ears": {
  "uid": "4f5438fc9337454587ec4a2c30c8c42f",
  "name": "Ear cross-section",
  "by": "Ebers",
  "license": null
 },
 "nose": {
  "uid": "d473f515f4844a3a9b835528f2cd0a7d",
  "name": "Nasal Pharynx Dissection (head)",
  "by": "flarar-01",
  "license": "Standard"
 },
 "tongue": {
  "uid": "d92cfd5873ac43299c7b64cdf9725526",
  "name": "Photorealistic human mouth",
  "by": "Cesar Salcedo CG",
  "license": "Standard"
 },
 "teeth": {
  "uid": "9cc281349c314cc4859e26af238f9cd5",
  "name": "Tooth cross-section",
  "by": "Ebers",
  "license": null
 },
 "mouth": {
  "uid": "522eda0ec0e3413a914b1b298a791320",
  "name": "Human mouth detailed",
  "by": "Mince",
  "license": "CC Attribution"
 },
 "skin": {
  "uid": "d6d0a676fb9144638008db9154eed14c",
  "name": "Skin Cross Section",
  "by": "ZMS1992",
  "license": "Standard"
 },
 "hair-nails": {
  "uid": "985ee571b2254791a911d5b5bdb4a763",
  "name": "Hair and Skin Anatomy",
  "by": "nuralam018",
  "license": null
 },
 "skeleton": {
  "uid": "657a31ed9704423c8c4e752fb2506a74",
  "name": "Human Skeleton Highresolution model",
  "by": "l.kuzyakin",
  "license": null
 },
 "skull": {
  "uid": "a47ef69ff3a4402783cff0f841bc5e0a",
  "name": "Human skull and neck",
  "by": "Lassi Kaukonen",
  "license": "CC Attribution"
 },
 "spine": {
  "uid": "bcd9eee09ce044ef98a69c315aa792e2",
  "name": "The human spinal column",
  "by": "3D",
  "license": "CC Attribution"
 },
 "ribs": {
  "uid": "0f1aa77bf02e4d438f8630bd6c53b12e",
  "name": "Anatomy human rib cage",
  "by": "FrancescoMilanese",
  "license": "Standard"
 },
 "arm-bones": {
  "uid": "56be24d886a64268930923bec3a0b96c",
  "name": "Elbow flexion - arm bones animated",
  "by": "pearsetoomey",
  "license": null
 },
 "hand": {
  "uid": "efd1df50e4a2457d91045a1727db7679",
  "name": "Hand",
  "by": "Team Skeleton Wars",
  "license": "CC Attribution"
 },
 "leg-bones": {
  "uid": "677378a849b04ae5babf769a7c1f2f89",
  "name": "Leg Bones",
  "by": "lkregula",
  "license": "Standard"
 },
 "foot": {
  "uid": "40e73f63fb0146f594f87239192494e4",
  "name": "Foot bones",
  "by": "Ebers",
  "license": "Standard"
 },
 "joints": {
  "uid": "0a2d68c6ec1f4ca783336c96f3c0a5fd",
  "name": "Knee Anatomy Model",
  "by": "University of Dundee, CAHID",
  "license": null
 },
 "muscles": {
  "uid": "5671210f79784619a9232605b0a4e6aa",
  "name": "Upper arm muscles",
  "by": "Ebers",
  "license": "Standard"
 },
 "heart": {
  "uid": "775d6629622740de8a5ed61a959c7506",
  "name": "[Animation] Human Heart",
  "by": "Michel Paschalis",
  "license": "Standard"
 },
 "blood-vessels": {
  "uid": "e7abdabd3a6d422cb25e6e63b45b1ab0",
  "name": "Circulatory System Human Anatomy",
  "by": "srikanthsamba",
  "license": "Standard"
 },
 "blood": {
  "uid": "e1b30076aeb34af6833af300a27fdef2",
  "name": "Blood Cells",
  "by": "Negrin",
  "license": null
 },
 "windpipe": {
  "uid": "ad7d7e16b98f421db0cda79f265fcc8d",
  "name": "Anatomy of the airways",
  "by": "E-learning UMCG",
  "license": "CC Attribution-NonCommercial-ShareAlike"
 },
 "voice-box": {
  "uid": "a00bc73a303c46248db6a13a88b23404",
  "name": "Anatomy of the Larynx",
  "by": "University of Dundee School of Medicine",
  "license": "CC Attribution-ShareAlike"
 },
 "lungs": {
  "uid": "ce09f4099a68467880f46e61eb9a3531",
  "name": "Realistic Human Lungs",
  "by": "neshallads",
  "license": "CC Attribution"
 },
 "diaphragm": {
  "uid": "29d0cb31105540c6963eca13287cee30",
  "name": "Diaphragm Animation",
  "by": "flarar-01",
  "license": "Standard"
 },
 "food-pipe": {
  "uid": "c98532301b3f42f8b5ecf2e0063e9d73",
  "name": "Human-Digestive System",
  "by": "1225659838@qq.com",
  "license": "Standard"
 },
 "stomach": {
  "uid": "e0f1952de7204654ba469c3e887a029b",
  "name": "Realistic Human Stomach",
  "by": "neshallads",
  "license": "CC Attribution-NonCommercial"
 },
 "gallbladder": {
  "uid": "6c4e9bd0d49f4828b804259330c0c6c4",
  "name": "Human liver and gallbladder",
  "by": "ElliotSS",
  "license": "CC Attribution"
 },
 "pancreas": {
  "uid": "8acf64dc315b49308b4fcbd47e48b92b",
  "name": "Pancreas Cross Section Anatomy",
  "by": "Nima",
  "license": "Standard"
 },
 "small-intestine": {
  "uid": "8a1ca8e3ca224cdeb9264674416bde38",
  "name": "Small and large intestine",
  "by": "antonia.sundberg",
  "license": "CC Attribution"
 },
 "appendix": {
  "uid": "0031f9c064d44c42a251543dc500f525",
  "name": "Digestive system",
  "by": "unlim3d",
  "license": "Standard"
 },
 "kidneys": {
  "uid": "e1476ceb1e3b4412af5418eee9c5ed08",
  "name": "Human Kidney",
  "by": "neshallads",
  "license": "CC Attribution"
 },
 "bladder": {
  "uid": "03d325c81aaa4dfabb74b727fec0a1a4",
  "name": "Kidneys - Urinary System",
  "by": "Cos",
  "license": null
 },
 "pituitary": {
  "uid": "042b7c37263f4309bc8b4e18dc989102",
  "name": "Limbic System - AP Psychology",
  "by": "shojig",
  "license": "CC Attribution"
 },
 "thyroid": {
  "uid": "5238a9dfeee4455d84ffc03211aa8798",
  "name": "Tireoide/  Thyroid / Prof. Dr. Gustavo Penna",
  "by": "DGF",
  "license": null
 },
 "adrenal": {
  "uid": "271e40e97ae048b3bea75e91a82bc84b",
  "name": "Adrenal Gland Cross Section Anatomy",
  "by": "Nima",
  "license": "Standard"
 },
 "spleen": {
  "uid": "621be4748b6b44fab11da23dc5d880c9",
  "name": "Spleen",
  "by": "Ebers",
  "license": "Standard"
 },
 "tonsils": {
  "uid": "b262c70bf9bd49c2a5428581b754f24b",
  "name": "Pharynx and Floor of Mouth",
  "by": "University of Dundee School of Medicine",
  "license": "CC Attribution-NonCommercial-ShareAlike"
 },
 "lymph": {
  "uid": "14800d739ecb46678d7584a401b0aa77",
  "name": "Lymphatic system",
  "by": "University of Dundee, CAHID",
  "license": null
 },
 "bone-marrow": {
  "uid": "47e6cc02a1094c4d885c6a7eba656584",
  "name": "Human Bone Section Anatomy",
  "by": "arloopa",
  "license": null
 },
 "white-cells": {
  "uid": "4b0561323abb4a71af3b61e8b4951ca3",
  "name": "White Blood Cells",
  "by": "Nima",
  "license": "Standard"
 },
 "cells": {
  "uid": "60ef7d2515b0403986ff9e8b7f234a66",
  "name": "Human Cell",
  "by": "markdragan",
  "license": "CC Attribution"
 },
 "dna": {
  "uid": "212e5422645f4432a61dc2f3aac3c8c8",
  "name": "DNA Helix with Base Pairing (3D)",
  "by": "NaraXR",
  "license": "CC Attribution-NonCommercial"
 },
 "womb": {
  "uid": "17dd4aefa7864af89333e9acd162ccff",
  "name": "Fetal Development Stages - Human embryonic",
  "by": "Nima",
  "license": "Standard"
 },
 "liver": {
  "uid": "6c4e9bd0d49f4828b804259330c0c6c4",
  "name": "Human liver and gallbladder",
  "by": "ElliotSS",
  "license": "CC Attribution"
 },
 "large-intestine": {
  "uid": "3a920101c4304eacaa3a422faacfc660",
  "name": "Bowel Anatomy",
  "by": "University of Dundee, CAHID",
  "license": null
 }
};
