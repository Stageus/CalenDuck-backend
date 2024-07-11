const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;

const psql = require("../../database/connect/postgre");

const makeToken = require("../modules/makeToken");

// 사용자 직렬화 설정
passport.serializeUser((user, done) => {
    done(null, user.id); // 사용자 ID를 세션에 저장
});

// 사용자 역직렬화 설정
passport.deserializeUser(async (id, done) => {
    try {
        const result = await psql.query(`
            SELECT *
            FROM calenduck.kakao
            WHERE id = $1
        `, [id]);

        done(null, result.rows[0]); // 사용자 객체를 복원
    } catch (err) {
        done(err);
    }
});

module.exports = () => {
    passport.use(
        new KakaoStrategy(
            {
                clientID: process.env.KAKAO_ID, // 카카오 로그인에서 발급받은 REST API 키
                callbackURL: "/oauth/kakao/callback", // 카카오 로그인 Redirect URI 경로
            },

            async (accessToken, refreshToken, profile, done) => {
                try {
                    const exUser = await psql.query(`
                        SELECT *
                        FROM calenduck.kakao
                        WHERE id = $1
                    `, [profile.id]);
                    // 이미 가입된 카카오 프로필이면 성공
                    if (exUser.rows.length !== 0) {
                        done(null, exUser.rows[0]); // 로그인 인증 완료
                    } else {
                        // 가입되지 않는 유저면 회원가입 시키고 로그인을 시킨다
                        const newUser = await psql.query(`
                            INSERT INTO calenduck.kakao(id)
                            VALUES($1)
                            RETURNING *
                        `, [profile.id]);

                        makeToken({ "email": profile._json.kakao_account.email });
                        done(null, newUser.rows[0]); // 회원가입하고 로그인 인증 완료
                    }
                } catch (error) {
                    done(error);
                }
            }
        )
    );
};
