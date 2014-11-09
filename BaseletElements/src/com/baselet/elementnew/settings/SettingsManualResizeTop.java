package com.baselet.elementnew.settings;

import java.util.List;

import com.baselet.control.enums.AlignHorizontal;
import com.baselet.control.enums.AlignVertical;
import com.baselet.diagram.draw.geom.XValues;
import com.baselet.elementnew.facet.ElementStyleEnum;
import com.baselet.elementnew.facet.Facet;

public abstract class SettingsManualResizeTop extends SettingsAbstract {
	@Override
	public XValues getXValues(double y, int height, int width) {
		return new XValues(0, width);
	}

	@Override
	public AlignVertical getVAlign() {
		return AlignVertical.TOP;
	}

	@Override
	public AlignHorizontal getHAlign() {
		return AlignHorizontal.CENTER;
	}

	@Override
	public ElementStyleEnum getElementStyle() {
		return ElementStyleEnum.SIMPLE;
	}

	@Override
	protected List<? extends Facet> createDefaultFacets() {
		return SettingsAbstract.ALL;
	}
}