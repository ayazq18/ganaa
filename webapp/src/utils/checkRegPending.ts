/* eslint-disable @typescript-eslint/no-explicit-any */

export function checkRegPending(data: Record<string, any>): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // 🔹 Common fields (sab admission types ke liye)
  const commonFields = [
    "firstName",
    "lastName",
    "age",
    "email",
    "phoneNumberCountryCode",
    "phoneNumber",
    "gender",
    "country",
    "fullAddress",
    "area",
    "referredTypeId._id",
    "referralDetails",
    "patientPicUrl",
    "patientHistory.admissionType",
    "education",
    "isMarried",
    "occupation",
    "patientHistory.admissionChecklist.applicationForAdmission",
    "patientHistory.admissionChecklist.capacityAssessment",
    "patientHistory.admissionChecklist.hospitalGuidelineForm",
    "patientHistory.admissionChecklist.finacialCounselling",
    "patientHistory.admissionChecklist.orientationOfFamily",
    "patientHistory.admissionChecklist.orientationOfPatient",
    "patientHistory.admissionChecklist.familyDeclaration",
    "patientHistory.resourceAllocation.centerId._id",
    "patientHistory.resourceAllocation.roomTypeId._id",
    "patientHistory.resourceAllocation.roomNumberId._id",
    "patientHistory.resourceAllocation.assignedDoctorId._id",
    "patientHistory.resourceAllocation.assignedTherapistId._id",
    "patientHistory.resourceAllocation.careStaff",
    "patientHistory.resourceAllocation.nurse",
    "patientHistory.illnessType",
    "patientHistory.patientCondition",
    "patientHistory.conditionDetails",
    "patientHistory.coverageStatus",
  ];

  const admissionType = data?.patientHistory?.admissionType;

  const checklist = data?.patientHistory?.admissionChecklist || {};

  // ✅ Step 1: Check common fields
  for (const field of commonFields) {
    const value = field.split(".").reduce((obj: any, key: string) => obj && obj[key], data);
    if (value === undefined || value === null || value === "") {
      missingFields.push(field);
    }
  }

  // ✅ Step 2: Voluntary
  if (admissionType === "Voluntary") {
    if (!checklist.voluntaryAdmissionForm) {
      missingFields.push("patientHistory.admissionChecklist.voluntaryAdmissionForm");
    }
  }

  // ✅ Step 3: Involuntary
  if (admissionType === "Involuntary") {
    if (!checklist.inVoluntaryAdmissionForm) {
      missingFields.push("patientHistory.admissionChecklist.inVoluntaryAdmissionForm");
    }

    if (!data?.patientHistory?.involuntaryAdmissionType) {
      missingFields.push("patientHistory.involuntaryAdmissionType");
    }

    if (!checklist.section94) {
      missingFields.push("patientHistory.admissionChecklist.section94");
    }
  }

  // ✅ Step 4: Minor
  if (admissionType === "Minor") {
    if (!checklist.minorAdmissionForm) {
      missingFields.push("patientHistory.admissionChecklist.minorAdmissionForm");
    }
  }

  // ✅ Step 5: Insurance
  if (checklist.isInsured) {
    if (!checklist.insuredFile) {
      missingFields.push("patientHistory.admissionChecklist.insuredFile");
    }
    if (!checklist.insuredDetail) {
      missingFields.push("patientHistory.admissionChecklist.insuredDetail");
    }
  }

  return { isValid: missingFields.length === 0, missingFields };
}
