/**
 * Audio Registry
 *
 * Maps lesson segments to pre-generated offline audio files.
 *
 * Key format:
 *   LESSONID_SEGMENTID
 *
 * Example:
 *   L_G10_01_ICT_ROLE_S1
 */

export const audioRegistry: Record<string, any> = {

  /* =========================
     GRADE 10 LESSONS
     ========================= */

  // Role of ICT
  L_G10_01_ICT_ROLE_S1: require("../../assets/audio/lessons/L_G10_01_ICT_ROLE/L_G10_01_ICT_ROLE_S1.mp3"),
  L_G10_01_ICT_ROLE_S2: require("../../assets/audio/lessons/L_G10_01_ICT_ROLE/L_G10_01_ICT_ROLE_S2.mp3"),
  L_G10_01_ICT_ROLE_S3: require("../../assets/audio/lessons/L_G10_01_ICT_ROLE/L_G10_01_ICT_ROLE_S3.mp3"),
  L_G10_01_ICT_ROLE_S4: require("../../assets/audio/lessons/L_G10_01_ICT_ROLE/L_G10_01_ICT_ROLE_S4.mp3"),
  L_G10_01_ICT_ROLE_S5: require("../../assets/audio/lessons/L_G10_01_ICT_ROLE/L_G10_01_ICT_ROLE_S5.mp3"),
  L_G10_01_ICT_ROLE_S6: require("../../assets/audio/lessons/L_G10_01_ICT_ROLE/L_G10_01_ICT_ROLE_S6.mp3"),

  // Computer Systems
  L_G10_02_COMPUTER_SYSTEMS_S1: require("../../assets/audio/lessons/L_G10_02_COMPUTER_SYSTEMS/L_G10_02_COMPUTER_SYSTEMS_S1.mp3"),
  L_G10_02_COMPUTER_SYSTEMS_S2: require("../../assets/audio/lessons/L_G10_02_COMPUTER_SYSTEMS/L_G10_02_COMPUTER_SYSTEMS_S2.mp3"),
  L_G10_02_COMPUTER_SYSTEMS_S3: require("../../assets/audio/lessons/L_G10_02_COMPUTER_SYSTEMS/L_G10_02_COMPUTER_SYSTEMS_S3.mp3"),
  L_G10_02_COMPUTER_SYSTEMS_S4: require("../../assets/audio/lessons/L_G10_02_COMPUTER_SYSTEMS/L_G10_02_COMPUTER_SYSTEMS_S4.mp3"),
  L_G10_02_COMPUTER_SYSTEMS_S5: require("../../assets/audio/lessons/L_G10_02_COMPUTER_SYSTEMS/L_G10_02_COMPUTER_SYSTEMS_S5.mp3"),
  L_G10_02_COMPUTER_SYSTEMS_S6: require("../../assets/audio/lessons/L_G10_02_COMPUTER_SYSTEMS/L_G10_02_COMPUTER_SYSTEMS_S6.mp3"),

  // Input Output
  L_G10_03_INPUT_OUTPUT_S1: require("../../assets/audio/lessons/L_G10_03_INPUT_OUTPUT/L_G10_03_INPUT_OUTPUT_S1.mp3"),
  L_G10_03_INPUT_OUTPUT_S2: require("../../assets/audio/lessons/L_G10_03_INPUT_OUTPUT/L_G10_03_INPUT_OUTPUT_S2.mp3"),
  L_G10_03_INPUT_OUTPUT_S3: require("../../assets/audio/lessons/L_G10_03_INPUT_OUTPUT/L_G10_03_INPUT_OUTPUT_S3.mp3"),
  L_G10_03_INPUT_OUTPUT_S4: require("../../assets/audio/lessons/L_G10_03_INPUT_OUTPUT/L_G10_03_INPUT_OUTPUT_S4.mp3"),
  L_G10_03_INPUT_OUTPUT_S5: require("../../assets/audio/lessons/L_G10_03_INPUT_OUTPUT/L_G10_03_INPUT_OUTPUT_S5.mp3"),
  L_G10_03_INPUT_OUTPUT_S6: require("../../assets/audio/lessons/L_G10_03_INPUT_OUTPUT/L_G10_03_INPUT_OUTPUT_S6.mp3"),

  // Data Representation
  L_G10_04_DATA_REPRESENTATION_S1: require("../../assets/audio/lessons/L_G10_04_DATA_REPRESENTATION/L_G10_04_DATA_REPRESENTATION_S1.mp3"),
  L_G10_04_DATA_REPRESENTATION_S2: require("../../assets/audio/lessons/L_G10_04_DATA_REPRESENTATION/L_G10_04_DATA_REPRESENTATION_S2.mp3"),
  L_G10_04_DATA_REPRESENTATION_S3: require("../../assets/audio/lessons/L_G10_04_DATA_REPRESENTATION/L_G10_04_DATA_REPRESENTATION_S3.mp3"),
  L_G10_04_DATA_REPRESENTATION_S4: require("../../assets/audio/lessons/L_G10_04_DATA_REPRESENTATION/L_G10_04_DATA_REPRESENTATION_S4.mp3"),
  L_G10_04_DATA_REPRESENTATION_S5: require("../../assets/audio/lessons/L_G10_04_DATA_REPRESENTATION/L_G10_04_DATA_REPRESENTATION_S5.mp3"),
  L_G10_04_DATA_REPRESENTATION_S6: require("../../assets/audio/lessons/L_G10_04_DATA_REPRESENTATION/L_G10_04_DATA_REPRESENTATION_S6.mp3"),

  // Logic Gates
  L_G10_05_LOGIC_GATES_S1: require("../../assets/audio/lessons/L_G10_05_LOGIC_GATES/L_G10_05_LOGIC_GATES_S1.mp3"),
  L_G10_05_LOGIC_GATES_S2: require("../../assets/audio/lessons/L_G10_05_LOGIC_GATES/L_G10_05_LOGIC_GATES_S2.mp3"),
  L_G10_05_LOGIC_GATES_S3: require("../../assets/audio/lessons/L_G10_05_LOGIC_GATES/L_G10_05_LOGIC_GATES_S3.mp3"),
  L_G10_05_LOGIC_GATES_S4: require("../../assets/audio/lessons/L_G10_05_LOGIC_GATES/L_G10_05_LOGIC_GATES_S4.mp3"),
  L_G10_05_LOGIC_GATES_S5: require("../../assets/audio/lessons/L_G10_05_LOGIC_GATES/L_G10_05_LOGIC_GATES_S5.mp3"),
  L_G10_05_LOGIC_GATES_S6: require("../../assets/audio/lessons/L_G10_05_LOGIC_GATES/L_G10_05_LOGIC_GATES_S6.mp3"),

  // Operating Systems
  L_G10_06_OPERATING_SYSTEMS_S1: require("../../assets/audio/lessons/L_G10_06_OPERATING_SYSTEMS/L_G10_06_OPERATING_SYSTEMS_S1.mp3"),
  L_G10_06_OPERATING_SYSTEMS_S2: require("../../assets/audio/lessons/L_G10_06_OPERATING_SYSTEMS/L_G10_06_OPERATING_SYSTEMS_S2.mp3"),
  L_G10_06_OPERATING_SYSTEMS_S3: require("../../assets/audio/lessons/L_G10_06_OPERATING_SYSTEMS/L_G10_06_OPERATING_SYSTEMS_S3.mp3"),
  L_G10_06_OPERATING_SYSTEMS_S4: require("../../assets/audio/lessons/L_G10_06_OPERATING_SYSTEMS/L_G10_06_OPERATING_SYSTEMS_S4.mp3"),
  L_G10_06_OPERATING_SYSTEMS_S5: require("../../assets/audio/lessons/L_G10_06_OPERATING_SYSTEMS/L_G10_06_OPERATING_SYSTEMS_S5.mp3"),
  L_G10_06_OPERATING_SYSTEMS_S6: require("../../assets/audio/lessons/L_G10_06_OPERATING_SYSTEMS/L_G10_06_OPERATING_SYSTEMS_S6.mp3"),

  // DBMS
  L_G10_07_DBMS_INTRO_S1: require("../../assets/audio/lessons/L_G10_07_DBMS_INTRO/L_G10_07_DBMS_INTRO_S1.mp3"),
  L_G10_07_DBMS_INTRO_S2: require("../../assets/audio/lessons/L_G10_07_DBMS_INTRO/L_G10_07_DBMS_INTRO_S2.mp3"),
  L_G10_07_DBMS_INTRO_S3: require("../../assets/audio/lessons/L_G10_07_DBMS_INTRO/L_G10_07_DBMS_INTRO_S3.mp3"),
  L_G10_07_DBMS_INTRO_S4: require("../../assets/audio/lessons/L_G10_07_DBMS_INTRO/L_G10_07_DBMS_INTRO_S4.mp3"),
  L_G10_07_DBMS_INTRO_S5: require("../../assets/audio/lessons/L_G10_07_DBMS_INTRO/L_G10_07_DBMS_INTRO_S5.mp3"),
  L_G10_07_DBMS_INTRO_S6: require("../../assets/audio/lessons/L_G10_07_DBMS_INTRO/L_G10_07_DBMS_INTRO_S6.mp3"),

  // ICT Applications
  L_G10_08_ICT_APPS_S1: require("../../assets/audio/lessons/L_G10_08_ICT_APPS/L_G10_08_ICT_APPS_S1.mp3"),
  L_G10_08_ICT_APPS_S2: require("../../assets/audio/lessons/L_G10_08_ICT_APPS/L_G10_08_ICT_APPS_S2.mp3"),
  L_G10_08_ICT_APPS_S3: require("../../assets/audio/lessons/L_G10_08_ICT_APPS/L_G10_08_ICT_APPS_S3.mp3"),
  L_G10_08_ICT_APPS_S4: require("../../assets/audio/lessons/L_G10_08_ICT_APPS/L_G10_08_ICT_APPS_S4.mp3"),
  L_G10_08_ICT_APPS_S5: require("../../assets/audio/lessons/L_G10_08_ICT_APPS/L_G10_08_ICT_APPS_S5.mp3"),
  L_G10_08_ICT_APPS_S6: require("../../assets/audio/lessons/L_G10_08_ICT_APPS/L_G10_08_ICT_APPS_S6.mp3"),

  /* =========================
     GRADE 11 LESSONS
     ========================= */

  L_G11_01_NETWORK_INTRO_S1: require("../../assets/audio/lessons/L_G11_01_NETWORK_INTRO/L_G11_01_NETWORK_INTRO_S1.mp3"),
  L_G11_01_NETWORK_INTRO_S2: require("../../assets/audio/lessons/L_G11_01_NETWORK_INTRO/L_G11_01_NETWORK_INTRO_S2.mp3"),
  L_G11_01_NETWORK_INTRO_S3: require("../../assets/audio/lessons/L_G11_01_NETWORK_INTRO/L_G11_01_NETWORK_INTRO_S3.mp3"),
  L_G11_01_NETWORK_INTRO_S4: require("../../assets/audio/lessons/L_G11_01_NETWORK_INTRO/L_G11_01_NETWORK_INTRO_S4.mp3"),
  L_G11_01_NETWORK_INTRO_S5: require("../../assets/audio/lessons/L_G11_01_NETWORK_INTRO/L_G11_01_NETWORK_INTRO_S5.mp3"),
  L_G11_01_NETWORK_INTRO_S6: require("../../assets/audio/lessons/L_G11_01_NETWORK_INTRO/L_G11_01_NETWORK_INTRO_S6.mp3"),

  L_G11_02_NETWORK_TYPES_S1: require("../../assets/audio/lessons/L_G11_02_NETWORK_TYPES/L_G11_02_NETWORK_TYPES_S1.mp3"),
  L_G11_02_NETWORK_TYPES_S2: require("../../assets/audio/lessons/L_G11_02_NETWORK_TYPES/L_G11_02_NETWORK_TYPES_S2.mp3"),
  L_G11_02_NETWORK_TYPES_S3: require("../../assets/audio/lessons/L_G11_02_NETWORK_TYPES/L_G11_02_NETWORK_TYPES_S3.mp3"),
  L_G11_02_NETWORK_TYPES_S4: require("../../assets/audio/lessons/L_G11_02_NETWORK_TYPES/L_G11_02_NETWORK_TYPES_S4.mp3"),
  L_G11_02_NETWORK_TYPES_S5: require("../../assets/audio/lessons/L_G11_02_NETWORK_TYPES/L_G11_02_NETWORK_TYPES_S5.mp3"),
  L_G11_02_NETWORK_TYPES_S6: require("../../assets/audio/lessons/L_G11_02_NETWORK_TYPES/L_G11_02_NETWORK_TYPES_S6.mp3")

};