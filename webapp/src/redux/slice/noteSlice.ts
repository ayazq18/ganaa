import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface ITherapistNote {
  noteDate?: string;
  noteTime?: string;
  note?: string;
  file?: File | null | string;
  sessionType?: string[];
  score?: string;
  subSessionType?: string[];
  therapistId?: string;
}

export interface INurseNote {
  patientId?: string;
  patientAdmissionHistoryId?: string;
  vitalsDate?: string;
  vitalsTime?: string;
  bp?: string;
  pulse?: string;
  temperature?: string;
  spo2?: string;
  rbs?: string;
  height?: string;
  weight?: string;
  note?: string;
}

interface IDoctorNote {
  noteDate?: string;
  noteTime?: string;
  note: string;
  doctorId: string;
}

const initialTherapistNote: ITherapistNote = {
  noteDate: "",
  noteTime: "",
  note: "",
  file: null,
  score: "",
  sessionType: [],
  subSessionType: [],
  therapistId: ""
};

const initialNurseNote: INurseNote = {
  vitalsDate: "",
  vitalsTime: "",
  bp: "",
  pulse: "",
  temperature: "",
  spo2: "",
  rbs: "",
  height: "",
  weight: "",
  note: ""
};

const initialDoctorNote: IDoctorNote = {
  noteDate: "",
  noteTime: "",
  note: "",
  doctorId: ""
};

const initialState = {
  therapistNote: initialTherapistNote,
  nurseNote: initialNurseNote,
  doctorNote: initialDoctorNote
};

const noteSlice = createSlice({
  name: "note",
  initialState,
  reducers: {
    setTherapistNote(state, action: PayloadAction<ITherapistNote>) {
      state.therapistNote = action.payload;
    },
    setNurseNote(state, action: PayloadAction<INurseNote>) {
      state.nurseNote = action.payload;
    },
    setDoctorNote(state, action: PayloadAction<IDoctorNote>) {
      state.doctorNote = action.payload;
    },
    resetTherapistNote(state) {
      state.therapistNote = initialTherapistNote;
    },
    resetNurseNote(state) {
      state.nurseNote = initialNurseNote;
    }
  }
});

export const { setTherapistNote, setNurseNote, setDoctorNote, resetTherapistNote, resetNurseNote } =
  noteSlice.actions;

export default noteSlice.reducer;
