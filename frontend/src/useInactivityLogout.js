// ============================================================

// FILE: src/hooks/useInactivityLogout.js

//

// Drop this hook into your React project.

// Call it once inside your main Layout component.

// It watches for mouse/keyboard inactivity and logs out

// after TIMEOUT_DURATION milliseconds of no activity.

// ============================================================

import { useEffect, useRef, useCallback } from "react";

import { useNavigate } from "react-router-dom";

// ----- CONFIG ------------------------------------------------

const TIMEOUT_DURATION = 10 * 60 * 1000; // 2 minutes (ms)

// Match your backend URL prefix. If your axios baseURL already

// includes "/api", use just "/logout/" here.

const LOGOUT_URL = "/api/logout/";

// Keys you use in localStorage — change if yours differ

const ACCESS_TOKEN_KEY = "access";

const REFRESH_TOKEN_KEY = "refresh";

// -------------------------------------------------------------

const useInactivityLogout = () => {

    const navigate = useNavigate();

    const timerRef = useRef(null);

    // ── Logout ────────────────────────────────────────────────

    const logoutUser = useCallback(async () => {

        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        try {

            if (accessToken && refreshToken) {

                await fetch(LOGOUT_URL, {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json",

                        "Authorization": `Bearer ${accessToken}`,

                    },

                    body: JSON.stringify({ refresh: refreshToken }), // key must be "refresh"

                });

            }

        } catch (err) {

            // Network error — still proceed with local logout

            console.warn("Logout request failed:", err);

        } finally {

            // Always clear local storage and redirect

            localStorage.removeItem(ACCESS_TOKEN_KEY);

            localStorage.removeItem(REFRESH_TOKEN_KEY);

            navigate("/Job-portal/role-selection", {

                state: { message: "You were logged out due to inactivity." }

            });

        }


    }, [navigate]);

    // ── Reset timer on any activity ───────────────────────────

    const resetTimer = useCallback(() => {

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(logoutUser, TIMEOUT_DURATION);

    }, [logoutUser]);

    // ── Attach / detach event listeners ───────────────────────

    useEffect(() => {

        const events = [

            "mousemove",

            "mousedown",

            "keypress",

            "keydown",

            "scroll",

            "touchstart",

            "click",

            "wheel",

        ];

        events.forEach((event) =>

            window.addEventListener(event, resetTimer, { passive: true })

        );

        resetTimer(); // Start the initial timer

        return () => {

            events.forEach((event) =>

                window.removeEventListener(event, resetTimer)

            );

            if (timerRef.current) clearTimeout(timerRef.current);

        };

    }, [resetTimer]);

};

export default useInactivityLogout;
