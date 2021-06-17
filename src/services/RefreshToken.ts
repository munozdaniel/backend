export class RefreshTokenService {
  private refreshTokens: any[] = [];
  constructor() {}
  addRefreshTokens(refreshToken: any) {
    this.refreshTokens.push(refreshToken);
  }
  removeRefreshTokens(refreshToken: any) {
    const index = this.refreshTokens.findIndex((x) => x === refreshToken);
    if (index !== -1) {
      this.refreshTokens.splice(index, 1);
    }
  }
  setRefreshTokens(refreshTokens: any[]) {
    this.refreshTokens = refreshTokens;
  }
  getRefreshTokens(): any {
    return this.refreshTokens;
  }
  existRefreshToken(refreshToken: any): boolean {
    const index = this.refreshTokens.findIndex(
      (x) => x.refreshToken === refreshToken
    );
    if (index !== -1) {
      return true;
    } else {
      return false;
    }
  }
  getItem(refreshToken: any): any {
    const index = this.refreshTokens.findIndex((x) => x === refreshToken);
    if (index !== -1) {
      return this.refreshTokens[index];
    } else {
      return null;
    }
  }
}
