export const DateTime = {
  get now() {
    return new Date();
  },

  ago: {
    get day() {
      return new Date(new Date().setHours(0, 0, 0, 0));
    },
    get hour() {
      return new Date(new Date().setHours(new Date().getHours() - 1));
    },
    get week() {
      return new Date(new Date().setDate(new Date().getDate() - 7));
    },
    get month() {
      return new Date(new Date().setDate(new Date().getDate() - 30));
    },
  },
};
