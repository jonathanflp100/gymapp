"""Captura todas as telas da apresentação. Uso: python3 cap_all.py pt|es"""
import asyncio, re, sys, os
from playwright.async_api import async_playwright

L = sys.argv[1] if len(sys.argv) > 1 else "pt"
ES = L == "es"
B = "http://localhost:4173"
O = f"/root/work/pdf/shots_{L}/"
os.makedirs(O, exist_ok=True)
GYM = "Gimnasio Titán" if ES else "Força Total"
SAVE = re.compile("Guardar" if ES else "Salvar", re.I)
TEACHER = re.compile("Usar como Entrenador" if ES else "Usar como Professor", re.I)
STUDENT = re.compile("Usar como Alumno" if ES else "Usar como Aluno", re.I)
txt = lambda pt, es: es if ES else pt

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        pg = await ctx.new_page()

        async def shot(n, wait=900):
            await pg.wait_for_timeout(wait)
            await pg.screenshot(path=O + n + ".png")

        async def as_student():
            await pg.goto(B + "/demo"); await pg.wait_for_timeout(1200)
            await pg.get_by_text(STUDENT).first.click(); await pg.wait_for_timeout(1800)

        async def as_teacher():
            await pg.goto(B + "/demo"); await pg.wait_for_timeout(1200)
            await pg.get_by_text(TEACHER).first.click(); await pg.wait_for_timeout(1800)

        # academia
        await pg.goto(B + "/demo"); await pg.wait_for_timeout(1200)
        await pg.locator("div.fixed.inset-0").get_by_text(GYM).first.click(); await pg.wait_for_timeout(300)
        await pg.get_by_text(SAVE).last.click(); await pg.wait_for_timeout(1800)
        await shot("01_home")
        nav = pg.locator("nav").last

        # treino
        await nav.get_by_role("button").nth(1).click(); await pg.wait_for_timeout(1000)
        await pg.get_by_role("button", name=re.compile("INICIAR|COMEÇAR|EMPEZAR", re.I)).first.click(); await pg.wait_for_timeout(1500)
        await shot("03_treino")
        await pg.get_by_text(txt("Ver execução", "Ver ejecución")).first.click(); await pg.wait_for_timeout(2200)
        await pg.mouse.move(5, 5); await shot("04_guia", 600)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(400)
        await pg.get_by_test_id("workout-exercise").nth(2).scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -170)"); await shot("20_treino_sugestao", 400)
        await pg.get_by_test_id("workout-exercise").nth(3).scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -120)"); await shot("27_biset", 400)
        pg.once("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await pg.get_by_role("button", name=re.compile("^Cancelar", re.I)).last.click(force=True); await pg.wait_for_timeout(800)

        # aulas, evolução, avaliação
        await nav.get_by_role("button").nth(2).click(); await shot("05_aulas", 1200)
        await nav.get_by_role("button").nth(3).click(); await pg.wait_for_timeout(2000)
        await pg.get_by_test_id("exercise-chart").scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, 230)"); await shot("21_evolucao_grafico", 400)
        await pg.get_by_role("button", name=re.compile("Músculos", re.I)).first.click(); await shot("22_mapa_semana", 1000)
        await pg.get_by_role("button", name=re.compile(txt("Avaliação", "Evaluación"))).first.click(); await pg.wait_for_timeout(900)
        await pg.mouse.wheel(0, 260); await shot("06_avaliacao")
        await nav.get_by_role("button").nth(0).click(); await pg.wait_for_timeout(900)
        await pg.get_by_text(re.compile("Ver ranking")).click(); await shot("07_ranking")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)

        # engajamento do aluno
        await pg.get_by_role("button", name=re.compile("Simular")).click(); await pg.wait_for_timeout(2600)
        await pg.get_by_text(re.compile(txt("Check-in feito hoje", "Check-in hecho hoy"))).scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, 150)"); await shot("13_aluno_engaj", 500)
        await pg.get_by_text(txt("Desafios do mês", "Desafíos del mes")).first.scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, 470)"); await shot("14_desafios", 500)

        # ideias de cardápio
        await pg.get_by_role("button", name=re.compile(txt("Ideias de cardápio", "Ideas de menú"))).click(); await pg.wait_for_timeout(800)
        await pg.evaluate("window.scrollBy(0, 170)"); await shot("30_cardapio", 400)

        # página e loja: dono coloca o WhatsApp e salva a loja de exemplo
        await as_teacher()
        await pg.get_by_label(re.compile("Configura")).first.click(); await pg.wait_for_timeout(1200)
        await shot("12_config")
        await pg.locator("label:has-text('WhatsApp') input").first.fill("+595 981 000000" if ES else "+55 11 99999-0000")
        await pg.get_by_role("button", name=SAVE).last.click(); await pg.wait_for_timeout(800)
        await pg.get_by_role("button", name=re.compile(txt("Salvar página e loja", "Guardar página y tienda"))).click(); await pg.wait_for_timeout(800)
        await pg.get_by_text(txt("Página pública da academia", "Página pública del gimnasio"), exact=False).first.scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -20)"); await shot("34_config_pagina", 500)

        # professor
        await as_teacher()
        await shot("08_prof_home")
        await pg.get_by_text(re.compile(txt("Alunos sumidos", "Alumnos ausentes"))).first.scroll_into_view_if_needed()
        await pg.mouse.wheel(0, -230); await shot("09_prof_sumidos")
        await pg.get_by_role("button", name=re.compile(txt("Relatório do mês", "Informe del mes"))).click(); await shot("25_relatorio", 1200)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await pg.get_by_role("button", name=re.compile(txt("Mural, desafios", "Avisos, desafíos"))).click(); await pg.wait_for_timeout(1000)
        await pg.get_by_role("tab", name="Check-in").click(); await pg.wait_for_timeout(800)
        await pg.get_by_role("button", name=re.compile("modo recep", re.I)).click(); await shot("16_recepcao", 1200)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await as_teacher()
        nav = pg.locator("nav").last
        await nav.get_by_role("button").nth(1).click(); await pg.wait_for_timeout(900)
        await pg.locator("main h3").first.click(); await shot("10_ficha_aluno", 1300)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await nav.get_by_role("button").nth(2).click(); await pg.wait_for_timeout(1500)
        await pg.get_by_role("button", name=re.compile(txt("Modelos prontos", "Modelos listos"))).click(); await shot("23_modelos", 700)
        await pg.keyboard.press("Escape")

        # loja no app do aluno
        await as_student()
        await pg.get_by_role("button", name=re.compile(txt("Loja da academia", "Tienda del gimnasio"))).click(); await shot("31_loja", 900)

        # página pública (sem login)
        pub = await (await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, storage_state=await ctx.storage_state())).new_page()
        await pub.goto(B + "/academia"); await pub.wait_for_timeout(1500)
        await pub.screenshot(path=O + "32_publica.png")
        await pub.get_by_text(txt("Planos", "Planes"), exact=True).scroll_into_view_if_needed()
        await pub.evaluate("window.scrollBy(0, -20)"); await pub.wait_for_timeout(400)
        await pub.screenshot(path=O + "32b_publica_planos.png")
        await pub.set_viewport_size({"width": 1280, "height": 800}); await pub.evaluate("window.scrollTo(0,0)"); await pub.wait_for_timeout(600)
        await pub.screenshot(path=O + "33_publica_desktop.png")
        await b.close()
        print("ok", L)

asyncio.run(main())
