<script>
  import {
    Page,
    Navbar,
    Block,
    BlockTitle,
    BlockHeader,
    Link,
  } from "framework7-svelte";
</script>

<Page>
  <Navbar title="About" backLink="Back" />
  <BlockTitle>Impressum</BlockTitle>
  <Block strong>
    <BlockHeader>Angaben gem&auml;&szlig; &sect; 5 TMG</BlockHeader>

    <p>
      Markus Philipp W&uuml;st<br />
      Teinacher Str. 6<br />
      71034 B&ouml;blingen
    </p>

    <BlockHeader>Kontakt</BlockHeader>
    <p>
      Telefon: +4970314667810<br />
      E-Mail: sukram230799@wuest.dev
    </p>

    <p>Quelle: <Link external href="https://www.e-recht24.de">e-recht24.de</Link></p>
  </Block>
</Page>
